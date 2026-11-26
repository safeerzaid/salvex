"""
Module 6: bidding rules - who may bid, the amount rule (first bid >= starting price, then higher than the
current bid), live-only, idempotency, late-bid extension, masked history and append-only bids.

Runs on the isolated local test database inside a transaction that is always rolled back. The race test
with real simultaneous commits is in test_bidding_concurrency.py.
"""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError

from app.models.audit_log import AuditLog
from app.models.auction import Auction
from app.models.auction_bid import AuctionBid
from app.models.user import User
from helpers import login, new_email, register_and_verify
from test_admin_foundation import make_admin
from test_auctions import action, at, new_auction, shift
from test_kyc import storage  # noqa: F401  (fixture)
from test_users_admin import make_user
from test_vehicles import approved_vehicle


async def verify_kyc(api, user_id) -> None:
    async with api.db() as db:
        (await db.get(User, user_id)).kyc_status = "verified"
        await db.commit()


async def verified_bidder(api) -> tuple[dict, uuid.UUID]:
    _, headers, uid = await make_user(api, "bidder")
    await verify_kyc(api, uid)
    return headers, uid


async def live_auction(api, **overrides) -> tuple[dict, dict, uuid.UUID, str]:
    """(admin headers, seller headers, seller id, auction id) for an auction that is live now."""
    _, admin = await make_admin(api)
    _, seller, seller_id = await make_user(api, "seller")
    vid = await approved_vehicle(api, seller, admin)
    body = {"starts_at": at(-0.2), "ends_at": at(60), **overrides}
    res = await new_auction(api, admin, vid, **body)
    assert res.status_code == 201, res.text
    return admin, seller, seller_id, res.json()["id"]


async def bid(api, headers, auction_id, amount, key=None, rc_option="with_rc"):
    extra = {"Idempotency-Key": key} if key else {}
    return await api.client.post(f"/api/auctions/{auction_id}/bids", headers={**headers, **extra},
                                 json={"amount": amount, "terms_accepted": True, "rc_option": rc_option})


# ------------------------------------------------- the two ladders: With RC and Without RC
async def test_with_rc_and_without_rc_are_two_separate_ladders(api, storage):
    """Every auction takes both rates (client, 2026-11-26). They never compete with each other."""
    _, _, _, aid = await live_auction(api, starting_price="100000", starting_price_without_rc="40000")
    first, _ = await verified_bidder(api)
    second, _ = await verified_bidder(api)

    public = (await api.client.get(f"/api/auctions/{aid}")).json()
    assert public["current_price"] is None and public["current_price_without_rc"] is None
    assert public["bid_count"] == 0 and public["bid_count_without_rc"] == 0
    # Neither ladder's expected amount is public.
    assert "starting_price" not in public and "starting_price_without_rc" not in public

    # Each ladder keeps its own expected amount.
    assert (await bid(api, first, aid, "50000")).json()["code"] == "bid_below_starting_price"
    assert (await bid(api, first, aid, "39999", rc_option="without_rc")).json()["code"] == "bid_below_starting_price"

    # 50,000 is too low With RC but fine Without RC: the ladders do not see each other.
    low = await bid(api, first, aid, "50000", rc_option="without_rc")
    assert low.status_code == 201 and low.json()["rc_option"] == "without_rc"
    assert low.json()["current_price"] == "50000.00" and low.json()["bid_count"] == 1

    high = await bid(api, second, aid, "100000")
    assert high.status_code == 201 and high.json()["rc_option"] == "with_rc"
    assert high.json()["current_price"] == "100000.00" and high.json()["bid_count"] == 1

    # The same amount may be bid once in each ladder, by different people.
    assert (await bid(api, second, aid, "100000", rc_option="without_rc")).status_code == 201

    public = (await api.client.get(f"/api/auctions/{aid}")).json()
    assert public["current_price"] == "100000.00" and public["bid_count"] == 1
    assert public["current_price_without_rc"] == "100000.00" and public["bid_count_without_rc"] == 2

    # Leading one ladder does not stop you bidding in the other, but does stop you bidding again in it.
    assert (await bid(api, second, aid, "120000")).json()["code"] == "already_highest"
    assert (await bid(api, first, aid, "120000")).status_code == 201

    async with api.db() as db:
        rows = (await db.execute(select(AuctionBid.rc_option, AuctionBid.amount)
                                 .where(AuctionBid.auction_id == uuid.UUID(aid)))).all()
    assert sorted((o, str(a)) for o, a in rows) == [
        ("with_rc", "100000.00"), ("with_rc", "120000.00"), ("without_rc", "100000.00"), ("without_rc", "50000.00")]


async def test_a_bid_needs_a_known_rc_option(api, storage):
    _, _, _, aid = await live_auction(api)
    headers, _ = await verified_bidder(api)
    res = await api.client.post(f"/api/auctions/{aid}/bids", headers=headers,
                                json={"amount": "60000", "terms_accepted": True, "rc_option": "maybe"})
    assert res.status_code == 422
    # Left out entirely it means With RC, so an older client keeps working.
    res = await api.client.post(f"/api/auctions/{aid}/bids", headers=headers,
                                json={"amount": "60000", "terms_accepted": True})
    assert res.status_code == 201 and res.json()["rc_option"] == "with_rc"


async def test_without_rc_has_no_minimum_when_no_expected_amount_is_set(api, storage):
    _, _, _, aid = await live_auction(api, starting_price="100000")        # no Without RC amount
    headers, _ = await verified_bidder(api)
    assert (await bid(api, headers, aid, "1", rc_option="without_rc")).status_code == 201


# ---------------------------------------------------------------------------- who may bid
async def test_only_kyc_verified_bidders_can_bid(api, storage):
    admin, seller, _, aid = await live_auction(api)
    assert (await api.client.post(f"/api/auctions/{aid}/bids", json={"amount": "60000", "terms_accepted": True})).status_code == 401
    for headers in (admin, seller):
        res = await bid(api, headers, aid, "60000")
        assert res.status_code == 403 and res.json()["code"] == "forbidden"
    _, unverified, _ = await make_user(api, "bidder")
    res = await bid(api, unverified, aid, "60000")
    assert res.status_code == 403 and res.json()["code"] == "kyc_required"
    headers, _ = await verified_bidder(api)
    assert (await bid(api, headers, aid, "60000")).status_code == 201


async def test_a_seller_turned_bidder_cannot_bid_on_their_own_vehicle(api, storage):
    admin, _, seller_id, aid = await live_auction(api)
    async with api.db() as db:
        seller = await db.get(User, seller_id)
        seller.role, seller.kyc_status = "bidder", "verified"
        email = seller.email
        await db.commit()
    headers = {"Authorization": f"Bearer {(await login(api.client, email, bearer=True)).json()['access_token']}"}
    api.client.cookies.clear()
    res = await bid(api, headers, aid, "60000")
    assert res.status_code == 403 and res.json()["code"] == "own_vehicle"


async def test_kyc_or_rights_lost_while_waiting_are_checked_under_the_lock(api, storage):
    from app.core.errors import ApiError
    from app.services.bidding import place_bid
    _, _, _, aid = await live_auction(api)
    _, uid = await verified_bidder(api)
    async with api.db() as request_db:
        bidder = await request_db.get(User, uid)                   # what the access check saw
        async with api.db() as other:
            (await other.get(User, uid)).kyc_status = "rejected"
            await other.commit()
        with pytest.raises(ApiError) as refused:
            from decimal import Decimal
            await place_bid(request_db, bidder, uuid.UUID(aid), Decimal("60000"), None)
        assert refused.value.code == "kyc_required"
        await request_db.rollback()


# ---------------------------------------------------------------------------- the amount rule
async def test_amount_rule_first_bid_at_least_start_then_any_higher_amount(api, storage):
    _, _, _, aid = await live_auction(api, starting_price="50000")
    first, first_id = await verified_bidder(api)
    second, second_id = await verified_bidder(api)

    low = await bid(api, first, aid, "49999.99")
    assert low.status_code == 409 and low.json()["code"] == "bid_below_starting_price"
    # The refusal must not give the starting price away: it is hidden from bidders (client, 2026-11-26).
    assert "50000" not in low.json()["detail"] and low.json()["detail"].startswith("Your bid is lower")
    ok = await bid(api, first, aid, "50000")
    assert ok.status_code == 201, ok.text
    body = ok.json()
    assert body["amount"] == "50000.00" and body["current_price"] == "50000.00" and body["bid_count"] == 1
    assert body["you_are_highest"] is True and body["repeated"] is False and body["server_time"]

    again = await bid(api, first, aid, "60000")
    assert again.status_code == 409 and again.json()["code"] == "already_highest"
    equal = await bid(api, second, aid, "50000")
    assert equal.status_code == 409 and equal.json()["code"] == "bid_too_low"
    penny = await bid(api, second, aid, "50000.01")                  # no fixed increment: any higher amount
    assert penny.status_code == 201 and penny.json()["bid_count"] == 2
    jump = await bid(api, first, aid, "275000")                      # any amount above is fine
    assert jump.status_code == 201

    async with api.db() as db:
        auction = await db.get(Auction, uuid.UUID(aid))
        await db.refresh(auction)
        assert str(auction.current_price) == "275000.00" and auction.current_winner_id == first_id and auction.bid_count == 3
    public = (await api.client.get(f"/api/auctions/{aid}")).json()
    assert public["current_price"] == "275000.00" and public["bid_count"] == 3


@pytest.mark.parametrize("amount", ["0", "-1", "abc", "100.123", "NaN", "1e20", None])
async def test_invalid_amounts_are_refused(api, storage, amount):
    _, _, _, aid = await live_auction(api)
    headers, _ = await verified_bidder(api)
    assert (await bid(api, headers, aid, amount)).status_code == 422
    res = await api.client.post(f"/api/auctions/{aid}/bids", headers=headers, json={"amount": "60000", "terms_accepted": True, "bidder_id": "x"})
    assert res.status_code == 422


# ---------------------------------------------------------------------------- only while live
async def test_bids_only_while_the_auction_is_live(api, storage):
    admin, _, _, aid = await live_auction(api)
    headers, _ = await verified_bidder(api)

    await shift(api, aid, starts_at=10, ends_at=60)                                     # upcoming
    assert (await bid(api, headers, aid, "60000")).json()["code"] == "auction_not_live"
    await shift(api, aid, starts_at=-10, ends_at=60)
    await action(api, admin, aid, "pause", reason="Checking documents")                  # paused
    assert (await bid(api, headers, aid, "60000")).json()["code"] == "auction_not_live"
    await action(api, admin, aid, "resume")
    await shift(api, aid, starts_at=-60, ends_at=-0.1)                                   # end time passed
    assert (await bid(api, headers, aid, "60000")).json()["code"] == "auction_not_live"
    await action(api, admin, aid, "close", reason="Time is up")                          # closed
    assert (await bid(api, headers, aid, "60000")).json()["code"] == "auction_not_live"

    _, _, _, other = await live_auction(api)
    await action(api, admin, other, "cancel", reason="Withdrawn")
    assert (await bid(api, headers, other, "60000")).status_code == 404
    assert (await bid(api, headers, uuid.uuid4(), "60000")).status_code == 404


# ---------------------------------------------------------------------------- double clicks
async def test_the_same_request_twice_is_one_bid(api, storage):
    _, _, _, aid = await live_auction(api)
    _, _, _, other = await live_auction(api)
    headers, _ = await verified_bidder(api)
    first = await bid(api, headers, aid, "60000", key="click-0001-abcd")
    second = await bid(api, headers, aid, "60000", key="click-0001-abcd")
    assert first.status_code == 201 and second.status_code == 200
    assert second.json()["repeated"] is True and second.json()["bid_id"] == first.json()["bid_id"]
    assert second.json()["bid_count"] == 1
    reused = await bid(api, headers, other, "60000", key="click-0001-abcd")
    assert reused.status_code == 409 and reused.json()["code"] == "idempotency_key_reused"
    for bad in ("short", "has spaces in it", "x" * 65, "semi;colon-key"):
        assert (await bid(api, headers, aid, "70000", key=bad)).status_code == 422, bad


# ---------------------------------------------------------------------------- late-bid extension
async def test_late_bids_extend_the_auction_only_when_switched_on(api, storage):
    _, _, _, aid = await live_auction(api, extension_enabled=True, extension_minutes=2)
    headers, _ = await verified_bidder(api)
    await shift(api, aid, ends_at=5)                                                    # 5 min left: no extension
    early = await bid(api, headers, aid, "60000")
    assert early.json()["time_extended"] is False
    await shift(api, aid, ends_at=0.5)                                                  # 30 s left
    other, _ = await verified_bidder(api)
    late = await bid(api, other, aid, "61000")
    assert late.json()["time_extended"] is True
    left = datetime.fromisoformat(late.json()["ends_at"]) - datetime.now(timezone.utc)
    assert timedelta(minutes=1, seconds=50) < left <= timedelta(minutes=2)
    async with api.db() as db:
        entry = (await db.execute(select(AuditLog).where(AuditLog.action == "auction.auto_extend",
                                                         AuditLog.target_id == aid))).scalar_one()
    assert entry.details["bid_id"] == late.json()["bid_id"]

    _, _, _, plain = await live_auction(api)                                            # switched off
    await shift(api, plain, ends_at=0.5)
    res = await bid(api, headers, plain, "60000")
    assert res.json()["time_extended"] is False


# ---------------------------------------------------------------------------- history and dashboards
async def test_public_history_hides_who_bid(api, storage):
    admin, _, _, aid = await live_auction(api)
    alice, alice_id = await verified_bidder(api)
    bob, _ = await verified_bidder(api)
    await bid(api, alice, aid, "60000")
    await bid(api, bob, aid, "61000")
    await bid(api, alice, aid, "62000")

    anon = (await api.client.get(f"/api/auctions/{aid}/bids")).json()
    assert [b["amount"] for b in anon["items"]] == ["62000.00", "61000.00", "60000.00"]
    assert [b["bidder"] for b in anon["items"]] == ["Bidder 1", "Bidder 2", "Bidder 1"]
    assert not any(b["is_you"] for b in anon["items"]) and str(alice_id) not in str(anon)
    mine = (await api.client.get(f"/api/auctions/{aid}/bids", headers=alice)).json()
    assert [b["is_you"] for b in mine["items"]] == [True, False, True]

    full = (await api.client.get(f"/api/admin/auctions/{aid}/bids", headers=admin)).json()
    assert full["items"][0]["bidder_id"] == str(alice_id)
    assert (await api.client.get(f"/api/admin/auctions/{aid}/bids", headers=alice)).status_code == 403


async def test_my_bids_shows_status_and_wins(api, storage):
    admin, _, _, aid = await live_auction(api)
    alice, _ = await verified_bidder(api)
    bob, _ = await verified_bidder(api)
    await bid(api, alice, aid, "60000")
    await bid(api, bob, aid, "65000")
    row = (await api.client.get("/api/bids/mine", headers=alice)).json()["items"][0]
    assert row["auction_id"] == aid and row["my_highest_bid"] == "60000.00" and row["current_price"] == "65000.00"
    assert row["you_are_highest"] is False and row["you_won"] is False and "*" not in row["registration_number"]

    await action(api, admin, aid, "close", reason="Ended")
    won = (await api.client.get("/api/bids/mine", headers=bob)).json()["items"][0]
    assert won["you_won"] is True and won["result"] == "sold" and won["phase"] == "ended"
    _, seller, _ = await make_user(api, "seller")
    assert (await api.client.get("/api/bids/mine", headers=seller)).status_code == 403


async def test_cookie_sessions_need_the_csrf_token_to_bid(api, storage):
    _, _, _, aid = await live_auction(api)
    email = new_email("cookie")
    await register_and_verify(api, email)
    async with api.db() as db:
        (await db.execute(select(User).where(User.email == email))).scalar_one().kyc_status = "verified"
        await db.commit()
    csrf = (await login(api.client, email)).json()["csrf_token"]
    refused = await api.client.post(f"/api/auctions/{aid}/bids", json={"amount": "60000", "terms_accepted": True})
    assert refused.status_code == 403 and refused.json()["code"] == "csrf_failed"
    ok = await api.client.post(f"/api/auctions/{aid}/bids", json={"amount": "60000", "terms_accepted": True}, headers={"X-CSRF-Token": csrf})
    assert ok.status_code == 201


# ---------------------------------------------------------------------------- integrity
async def test_bids_cannot_be_edited_or_deleted(api, storage):
    _, _, _, aid = await live_auction(api)
    headers, _ = await verified_bidder(api)
    bid_id = (await bid(api, headers, aid, "60000")).json()["bid_id"]
    for sql in ("UPDATE auction_bids SET amount = 1 WHERE id = :i", "DELETE FROM auction_bids WHERE id = :i",
                "TRUNCATE auction_bids"):
        async with api.db() as db:
            with pytest.raises(DBAPIError) as caught:
                await db.execute(text(sql), {"i": bid_id})
            assert "append-only" in str(caught.value)
            await db.rollback()
    async with api.db() as db:                                     # equal amounts are refused by the database too
        db.add(AuctionBid(auction_id=uuid.UUID(aid), bidder_id=(await db.get(AuctionBid, uuid.UUID(bid_id))).bidder_id,
                          amount=60000))
        with pytest.raises(DBAPIError):
            await db.flush()
        await db.rollback()


async def test_starting_price_cannot_change_after_a_bid(api, storage):
    admin, _, _, aid = await live_auction(api)
    headers, _ = await verified_bidder(api)
    await bid(api, headers, aid, "60000")
    res = await api.client.patch(f"/api/admin/auctions/{aid}", headers=admin, json={"starting_price": "1000"})
    assert res.status_code == 409


async def test_a_bid_needs_the_bidder_to_accept_the_terms(api, storage):
    _, _, _, aid = await live_auction(api)
    headers, _ = await verified_bidder(api)
    for body in ({"amount": "60000"}, {"amount": "60000", "terms_accepted": False}, {"amount": "60000", "terms_accepted": "yes"}):
        res = await api.client.post(f"/api/auctions/{aid}/bids", headers=headers, json=body)
        assert res.status_code == 422, body
    async with api.db() as db:
        assert (await db.get(Auction, uuid.UUID(aid))).bid_count == 0


async def test_catalogue_cards_link_to_the_open_auction_and_my_bids_has_a_photo(api, storage):
    _, _, _, aid = await live_auction(api)
    headers, _ = await verified_bidder(api)
    await bid(api, headers, aid, "61000")
    auction = (await api.client.get(f"/api/auctions/{aid}")).json()
    vid = auction["vehicle"]["id"]
    card = (await api.client.get(f"/api/catalogue/vehicles/{vid}")).json()
    assert card["auction"]["id"] == aid and card["auction"]["phase"] == "live" and card["auction"]["current_price"] == "61000.00"
    listed = (await api.client.get("/api/catalogue/vehicles?page_size=100")).json()
    assert next(v for v in listed["items"] if v["id"] == vid)["auction"]["id"] == aid
    row = (await api.client.get("/api/bids/mine", headers=headers)).json()["items"][0]
    assert row["photo_id"] == auction["vehicle"]["photo_ids"][0]
