"""
Module 5: auctions - admin scheduling and lifecycle (pause, resume, extend, cancel, close), the public
live/upcoming/ended lists, and the link with vehicles.

Runs on the isolated local test database inside a transaction that is always rolled back. Times are moved
by editing rows directly where a test needs "the auction has started" or "the end time has passed".
"""
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.exc import DBAPIError

from app.models.audit_log import AuditLog
from app.models.auction import Auction
from test_admin_foundation import load_user, make_admin
from test_kyc import storage  # noqa: F401  (fixture)
from test_users_admin import make_user
from test_vehicles import add_photo, approved_vehicle, create, submitted_vehicle


def at(minutes: float) -> str:
    return (datetime.now(timezone.utc) + timedelta(minutes=minutes)).isoformat()


def auction_body(vehicle_id, **overrides) -> dict:
    body = {"vehicle_id": vehicle_id, "starting_price": "50000", "starts_at": at(60), "ends_at": at(180)}
    body.update(overrides)
    return body


async def new_auction(api, admin, vehicle_id, **overrides):
    return await api.client.post("/api/admin/auctions", headers=admin, json=auction_body(vehicle_id, **overrides))


async def setup(api):
    """An admin, a seller and an approved vehicle."""
    _, admin = await make_admin(api)
    _, seller, _ = await make_user(api, "seller")
    vid = await approved_vehicle(api, seller, admin)
    return admin, seller, vid


async def shift(api, auction_id, **minutes_by_field):
    """Move stored times relative to now, e.g. shift(api, id, starts_at=-10) = started ten minutes ago."""
    async with api.db() as db:
        auction = await db.get(Auction, uuid.UUID(auction_id))
        for field, minutes in minutes_by_field.items():
            setattr(auction, field, datetime.now(timezone.utc) + timedelta(minutes=minutes))
        await db.commit()


async def action(api, admin, auction_id, name, **body):
    return await api.client.post(f"/api/admin/auctions/{auction_id}/{name}", headers=admin, json=body)


async def public_ids(api, phase):
    res = await api.client.get(f"/api/auctions?phase={phase}&page_size=100")
    assert res.status_code == 200, res.text
    return {a["id"]: a for a in res.json()["items"]}


# ---------------------------------------------------------------------------- creating
async def test_admin_creates_an_auction_for_an_approved_vehicle(api, storage):
    admin, _, vid = await setup(api)
    res = await new_auction(api, admin, vid, starting_price="75000.50", extension_enabled=True)
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["status"] == "scheduled" and body["phase"] == "upcoming" and body["result"] is None
    assert body["starting_price"] == "75000.50" and body["current_price"] is None and body["bid_count"] == 0
    assert body["extension_enabled"] is True and body["extension_minutes"] == 2          # provisional default
    assert body["server_time"] and body["history"][0]["action"] == "auction.create"
    assert body["history"][0]["details"]["starting_price"] == "75000.50"


async def test_only_approved_vehicles_and_one_open_auction_per_vehicle(api, storage):
    admin, seller, vid = await setup(api)
    draft = (await create(api, seller)).json()["id"]
    pending = await submitted_vehicle(api, seller)
    for other in (draft, pending):
        res = await new_auction(api, admin, other)
        assert res.status_code == 409 and res.json()["code"] == "vehicle_not_approved"
    assert (await new_auction(api, admin, str(uuid.uuid4()))).status_code == 404
    assert (await new_auction(api, admin, vid)).status_code == 201
    second = await new_auction(api, admin, vid)
    assert second.status_code == 409 and second.json()["code"] == "vehicle_already_auctioned"


@pytest.mark.parametrize("overrides", [
    {"starting_price": "0"}, {"starting_price": "-5"}, {"starting_price": "abc"}, {"starting_price": "100.123"},
    {"starting_price": "1e20"}, {"starting_price": "NaN"}, {"starting_price": None},
    {"starts_at": "2026-12-01T10:00:00"},                                             # no timezone
    {"ends_at": at(30)},                                                                # ends before start
    {"extension_minutes": 0}, {"extension_minutes": 61}, {"status": "closed"}, {"current_price": "1"},
])
async def test_invalid_auction_details_are_refused(api, storage, overrides):
    admin, _, vid = await setup(api)
    res = await new_auction(api, admin, vid, **overrides)
    assert res.status_code == 422, (overrides, res.text)


@pytest.mark.parametrize("overrides,code", [
    ({"starts_at": at(-10), "ends_at": at(60)}, "invalid_schedule"),                  # start in the past
    ({"starts_at": at(60), "ends_at": at(62)}, "invalid_schedule"),                   # shorter than 5 minutes
    ({"starts_at": at(60), "ends_at": at(60 + 61 * 24 * 60)}, "invalid_schedule"),    # longer than 60 days
])
async def test_schedule_limits(api, storage, overrides, code):
    admin, _, vid = await setup(api)
    res = await new_auction(api, admin, vid, **overrides)
    assert res.status_code == 422 and res.json()["code"] == code


async def test_an_auction_can_start_right_now(api, storage):
    admin, _, vid = await setup(api)
    res = await new_auction(api, admin, vid, starts_at=at(-0.2), ends_at=at(30))
    assert res.status_code == 201 and res.json()["phase"] == "live"


# ---------------------------------------------------------------------------- public lists
async def test_public_lists_by_phase_with_server_time_and_vehicle(api, storage):
    admin, seller, vid = await setup(api)
    upcoming = (await new_auction(api, admin, vid)).json()["id"]
    vid2 = await approved_vehicle(api, seller, admin)
    live = (await new_auction(api, admin, vid2)).json()["id"]
    await shift(api, live, starts_at=-10, ends_at=30)

    live_items = await public_ids(api, "live")
    assert live in live_items and upcoming not in live_items
    card = live_items[live]
    assert card["phase"] == "live" and card["server_time"] and card["current_price"] is None
    assert card["vehicle"]["id"] == vid2 and "*" not in card["vehicle"]["registration_number"]
    # The starting price is admin-only (client, 2026-11-26): it must not reach any public view.
    assert not {"current_winner_id", "created_by_id", "status", "starting_price"} & set(card)
    assert "starting_price" not in (card["vehicle"].get("auction") or {})
    assert upcoming in await public_ids(api, "upcoming") and live not in await public_ids(api, "upcoming")
    assert (await api.client.get(f"/api/auctions/{live}")).json()["phase"] == "live"
    assert (await api.client.get("/api/auctions?phase=everything")).status_code == 422
    assert (await api.client.get(f"/api/auctions/{uuid.uuid4()}")).status_code == 404


async def test_an_auction_whose_end_has_passed_is_closing_until_closed(api, storage):
    admin, _, vid = await setup(api)
    aid = (await new_auction(api, admin, vid)).json()["id"]
    await shift(api, aid, starts_at=-60, ends_at=-1)
    assert (await api.client.get(f"/api/auctions/{aid}")).json()["phase"] == "closing"
    assert aid not in await public_ids(api, "live")


# ---------------------------------------------------------------------------- editing
async def test_price_and_times_change_only_before_the_start_but_extension_setting_any_time(api, storage):
    admin, _, vid = await setup(api)
    aid = (await new_auction(api, admin, vid)).json()["id"]
    res = await api.client.patch(f"/api/admin/auctions/{aid}", headers=admin,
                                 json={"starting_price": "60000", "ends_at": at(240)})
    assert res.status_code == 200 and res.json()["starting_price"] == "60000.00"
    assert res.json()["scheduled_ends_at"] == res.json()["ends_at"]
    update = [h for h in res.json()["history"] if h["action"] == "auction.update"][0]
    assert set(update["details"]["changes"]) == {"starting_price", "ends_at"}

    await shift(api, aid, starts_at=-5)                                                 # now live
    late = await api.client.patch(f"/api/admin/auctions/{aid}", headers=admin, json={"starting_price": "1000"})
    assert late.status_code == 409 and late.json()["code"] == "auction_started"
    toggle = await api.client.patch(f"/api/admin/auctions/{aid}", headers=admin,
                                    json={"extension_enabled": True, "extension_minutes": 5})
    assert toggle.status_code == 200 and toggle.json()["extension_enabled"] is True and toggle.json()["extension_minutes"] == 5
    for body in ({}, {"starting_price": None}, {"status": "closed"}, {"extension_minutes": 99}):
        assert (await api.client.patch(f"/api/admin/auctions/{aid}", headers=admin, json=body)).status_code == 422, body


# ---------------------------------------------------------------------------- lifecycle
async def test_pause_and_resume_move_the_end_by_the_paused_time(api, storage):
    admin, _, vid = await setup(api)
    aid = (await new_auction(api, admin, vid)).json()["id"]
    await shift(api, aid, starts_at=-10, ends_at=30)
    assert (await action(api, admin, aid, "pause")).status_code == 422                 # reason required
    paused = await action(api, admin, aid, "pause", reason="Document check")
    assert paused.status_code == 200 and paused.json()["status"] == "paused" and paused.json()["phase"] == "paused"
    assert aid in await public_ids(api, "live")                                         # still shown, as paused
    assert (await action(api, admin, aid, "pause", reason="again")).status_code == 409

    async with api.db() as db:                                                          # pretend 10 minutes passed
        auction = await db.get(Auction, uuid.UUID(aid))
        auction.paused_at = datetime.now(timezone.utc) - timedelta(minutes=10)
        before_end = auction.ends_at
        await db.commit()
    resumed = await action(api, admin, aid, "resume")
    assert resumed.status_code == 200 and resumed.json()["phase"] == "live"
    new_end = datetime.fromisoformat(resumed.json()["ends_at"])
    assert timedelta(minutes=9, seconds=55) <= new_end - before_end <= timedelta(minutes=10, seconds=5)
    entry = [h for h in resumed.json()["history"] if h["action"] == "auction.resume"][0]
    assert 595 <= entry["details"]["paused_seconds"] <= 605
    assert (await action(api, admin, aid, "resume")).status_code == 409


async def test_extend_cancel_and_close(api, storage):
    admin, seller, vid = await setup(api)
    aid = (await new_auction(api, admin, vid)).json()["id"]
    before = datetime.fromisoformat((await api.client.get(f"/api/admin/auctions/{aid}", headers=admin)).json()["ends_at"])
    assert (await action(api, admin, aid, "extend", minutes=15)).status_code == 422     # reason required
    extended = await action(api, admin, aid, "extend", minutes=15, reason="High interest")
    assert datetime.fromisoformat(extended.json()["ends_at"]) - before == timedelta(minutes=15)

    cancelled = await action(api, admin, aid, "cancel", reason="Vehicle withdrawn by insurer")
    assert cancelled.status_code == 200 and cancelled.json()["status"] == "cancelled"
    for name, body in (("pause", {"reason": "x y z"}), ("extend", {"minutes": 5, "reason": "x y z"}),
                       ("cancel", {"reason": "x y z"}), ("close", {"reason": "x y z"})):
        assert (await action(api, admin, aid, name, **body)).status_code == 409, name
    assert (await api.client.get(f"/api/auctions/{aid}")).status_code == 404            # cancelled = not public

    again = await new_auction(api, admin, vid)                                          # the vehicle is free again
    assert again.status_code == 201
    closed = await action(api, admin, again.json()["id"], "close", reason="No interest")
    assert closed.status_code == 200 and closed.json()["status"] == "closed" and closed.json()["result"] == "no_sale"
    assert again.json()["id"] in await public_ids(api, "ended")
    assert (await new_auction(api, admin, vid)).status_code == 201                      # no sale: can be re-auctioned


async def test_closing_with_a_highest_bidder_sells_and_locks_the_vehicle(api, storage):
    admin, seller, vid = await setup(api)
    aid = (await new_auction(api, admin, vid)).json()["id"]
    _, _, bidder_id = await make_user(api, "bidder")
    async with api.db() as db:                                     # the bidding engine (Module 6) will do this
        auction = await db.get(Auction, uuid.UUID(aid))
        auction.current_price, auction.current_winner_id, auction.bid_count = Decimal("81000.00"), bidder_id, 3
        await db.commit()
    closed = (await action(api, admin, aid, "close", reason="Ended early by request")).json()
    assert closed["result"] == "sold" and closed["current_winner_id"] == str(bidder_id)
    entry = [h for h in closed["history"] if h["action"] == "auction.close"][0]
    assert entry["details"]["final_price"] == "81000.00" and entry["details"]["winner_id"] == str(bidder_id)
    sold_again = await new_auction(api, admin, vid)
    assert sold_again.status_code == 409 and sold_again.json()["code"] == "vehicle_already_auctioned"
    locked = await api.client.patch(f"/api/vehicles/{vid}", headers=admin, json={"location": "Moved"})
    assert locked.status_code == 409 and locked.json()["code"] == "vehicle_in_auction"


async def test_a_vehicle_in_an_open_auction_cannot_be_changed(api, storage):
    admin, _, vid = await setup(api)
    await new_auction(api, admin, vid)
    res = await api.client.patch(f"/api/vehicles/{vid}", headers=admin, json={"location": "Elsewhere"})
    assert res.status_code == 409 and res.json()["code"] == "vehicle_in_auction"
    assert (await add_photo(api, admin, vid)).status_code == 409


# ---------------------------------------------------------------------------- safety
async def test_only_admins_manage_auctions(api, storage):
    admin, seller, vid = await setup(api)
    aid = (await new_auction(api, admin, vid)).json()["id"]
    _, bidder, _ = await make_user(api, "bidder")
    for headers in (seller, bidder):
        assert (await new_auction(api, headers, vid)).status_code == 403
        assert (await action(api, headers, aid, "cancel", reason="not mine")).status_code == 403
    assert (await api.client.post("/api/admin/auctions", json=auction_body(vid))).status_code == 401


async def test_an_admin_who_lost_rights_mid_request_is_refused(api, storage):
    from app.core.errors import ApiError
    from app.services.auctions import cancel_auction
    admin_email, admin = await make_admin(api)
    _, seller, _ = await make_user(api, "seller")
    vid = await approved_vehicle(api, seller, admin)
    aid = (await new_auction(api, admin, vid)).json()["id"]
    async with api.db() as request_db:
        actor = await load_user(api, admin_email)
        actor = await request_db.get(type(actor), actor.id)
        async with api.db() as other:
            row = await other.get(type(actor), actor.id)
            row.role = "bidder"
            await other.commit()
        with pytest.raises(ApiError) as refused:
            await cancel_auction(request_db, actor, uuid.UUID(aid), "stale rights")
        assert refused.value.status_code == 403
        await request_db.rollback()


async def test_a_failed_audit_write_creates_nothing(api, storage, monkeypatch):
    admin, _, vid = await setup(api)

    async def broken(*args, **kwargs):
        raise RuntimeError("audit store unavailable")

    monkeypatch.setattr("app.services.auctions.record_audit", broken)
    with pytest.raises(RuntimeError):
        await new_auction(api, admin, vid)
    monkeypatch.undo()
    async with api.db() as db:
        assert (await db.execute(select(Auction).where(Auction.vehicle_id == uuid.UUID(vid)))).first() is None


async def test_database_rules_hold_even_without_the_application(api, storage):
    admin, _, vid = await setup(api)
    aid = uuid.UUID((await new_auction(api, admin, vid)).json()["id"])
    for change in ({"result": "sold"}, {"status": "closed"}, {"starting_price": Decimal("0")},
                   {"bid_count": -1}, {"current_price": Decimal("1.00")}):
        async with api.db() as db:
            auction = await db.get(Auction, aid)
            for field, value in change.items():
                setattr(auction, field, value)
            with pytest.raises(DBAPIError):
                await db.flush()
            await db.rollback()
    async with api.db() as db:
        entries = (await db.execute(select(AuditLog.action).where(AuditLog.target_id == str(aid)))).scalars().all()
    assert entries == ["auction.create"]


async def test_public_auction_lists_filter_by_vehicle_category(api, storage):
    admin, seller, vid = await setup(api)                       # default category: used_vehicle
    bank_vid = await approved_vehicle(api, seller, admin, category="bank_nbfc")
    used = (await new_auction(api, admin, vid)).json()["id"]
    bank = (await new_auction(api, admin, bank_vid)).json()["id"]

    async def ids(query):
        res = await api.client.get(f"/api/auctions?phase=upcoming&page_size=100&{query}")
        assert res.status_code == 200, res.text
        return {a["id"]: a for a in res.json()["items"]}

    in_bank = await ids("category=bank_nbfc")
    assert bank in in_bank and used not in in_bank
    assert in_bank[bank]["vehicle"]["category"] == "bank_nbfc"
    in_used = await ids("category=used_vehicle")
    assert used in in_used and bank not in in_used
    assert {used, bank} <= set(await ids(""))
    assert (await api.client.get("/api/auctions?category=boats")).status_code == 422
