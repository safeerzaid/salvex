"""
Notifications (bell + email outbox) and spare parts (catalogue, requests, admin answers).
"""
import uuid

from sqlalchemy import select

from app.models.notification import Notification
from app.models.user import User
from app.services.notifications import MAX_ATTEMPTS, send_pending_emails
from helpers import CapturingEmailService
from test_admin_foundation import load_user, make_admin
from test_auctions import action
from test_bidding import bid, live_auction, verified_bidder
from test_kyc import JPEG, png, start, storage, submitted  # noqa: F401  (storage is a fixture)
from test_users_admin import make_user


async def kinds_for(api, user_id) -> list:
    async with api.db() as db:
        return (await db.execute(select(Notification.kind).where(Notification.user_id == user_id)
                                 .order_by(Notification.created_at))).scalars().all()


class Mailer(CapturingEmailService):
    def __init__(self, fail=False):
        super().__init__()
        self.fail = fail

    async def send_notification(self, to_email, user_name, title, body, link=None):
        if self.fail:
            return False, "smtp down"
        self.sent.append({"type": "notification", "to": to_email, "title": title, "link": link})
        return True, "captured"


# ---------------------------------------------------------------------------- who gets notified
async def test_outbid_won_and_sold_notifications(api, storage):
    admin, _, seller_id, aid = await live_auction(api)
    first, first_id = await verified_bidder(api)
    second, second_id = await verified_bidder(api)
    await bid(api, first, aid, "60000")
    await bid(api, second, aid, "61000")
    assert await kinds_for(api, first_id) == ["outbid"]
    await action(api, admin, aid, "close", reason="Ended")
    assert await kinds_for(api, second_id) == ["auction_won"]
    assert (await kinds_for(api, seller_id))[-1] == "vehicle_sold"            # after the earlier "vehicle approved"
    async with api.db() as db:
        note = (await db.execute(select(Notification).where(Notification.user_id == first_id, Notification.kind == "outbid"))).scalar_one()
    assert await kinds_for(api, first_id) == ["outbid", "auction_lost"]        # and told they did not win
    assert note.link == f"/auctions/{aid}" and note.email_status == "pending"


async def test_kyc_submission_and_decision_notifications(api, storage):
    admin_email, admin = await make_admin(api)
    admin_id = (await load_user(api, admin_email)).id
    _, _, uid, sid, _ = await submitted(api)
    assert "kyc_submitted" in await kinds_for(api, admin_id)
    await api.client.post(f"/api/admin/kyc/submissions/{sid}/decision", headers=admin,
                          json={"decision": "request_changes", "reason": "Photo is blurred"})
    async with api.db() as db:
        note = (await db.execute(select(Notification).where(Notification.user_id == uid))).scalar_one()
    assert note.kind == "kyc_decision" and "Photo is blurred" in note.body


# ---------------------------------------------------------------------------- the bell
async def test_bell_lists_counts_and_marks_read_only_your_own(api, storage):
    admin, _, _, aid = await live_auction(api)
    first, first_id = await verified_bidder(api)
    second, _ = await verified_bidder(api)
    await bid(api, first, aid, "60000")
    await bid(api, second, aid, "61000")

    assert (await api.client.get("/api/notifications/unread-count")).status_code == 401
    assert (await api.client.get("/api/notifications/unread-count", headers=first)).json() == {"unread": 1}
    items = (await api.client.get("/api/notifications", headers=first)).json()["items"]
    # The title names the ladder: every auction runs With RC and Without RC (client, 2026-11-26).
    assert items[0]["title"] == "You have been outbid (With RC)" and items[0]["read_at"] is None
    assert (await api.client.post(f"/api/notifications/{items[0]['id']}/read", headers=second)).status_code == 404
    read = await api.client.post(f"/api/notifications/{items[0]['id']}/read", headers=first)
    assert read.status_code == 200 and read.json()["read_at"]
    assert (await api.client.get("/api/notifications/unread-count", headers=first)).json() == {"unread": 0}
    await bid(api, first, aid, "62000")
    await bid(api, second, aid, "63000")
    assert (await api.client.post("/api/notifications/read-all", headers=first)).json() == {"unread": 0}


# ---------------------------------------------------------------------------- email outbox
async def test_outbox_sends_once_retries_then_gives_up(api, storage):
    _, _, _, aid = await live_auction(api)
    first, first_id = await verified_bidder(api)
    second, _ = await verified_bidder(api)
    await bid(api, first, aid, "60000")
    await bid(api, second, aid, "61000")

    for _ in range(MAX_ATTEMPTS):
        await send_pending_emails(api.db, Mailer(fail=True))
    async with api.db() as db:
        note = (await db.execute(select(Notification).where(Notification.user_id == first_id, Notification.kind == "outbid"))).scalar_one()
        await db.refresh(note)
    assert note.email_status == "failed" and note.email_attempts == MAX_ATTEMPTS

    await bid(api, first, aid, "62000")
    await bid(api, second, aid, "63000")
    mailer = Mailer()
    await send_pending_emails(api.db, mailer)
    await send_pending_emails(api.db, mailer)                       # a second pass sends nothing again
    async with api.db() as db:
        first_email = (await db.get(User, first_id)).email
    mine = [m for m in mailer.sent if m["title"] == "You have been outbid (With RC)" and m["to"] == first_email]
    assert len(mine) == 1 and mine[0]["link"] == f"/auctions/{aid}"


async def test_suspended_users_get_no_email(api, storage):
    _, _, _, aid = await live_auction(api)
    first, first_id = await verified_bidder(api)
    second, _ = await verified_bidder(api)
    await bid(api, first, aid, "60000")
    await bid(api, second, aid, "61000")
    async with api.db() as db:
        (await db.get(User, first_id)).is_active = False
        await db.commit()
    mailer = Mailer()
    await send_pending_emails(api.db, mailer)
    async with api.db() as db:
        note = (await db.execute(select(Notification).where(Notification.user_id == first_id, Notification.kind == "outbid"))).scalar_one()
        await db.refresh(note)
    assert note.email_status == "skipped" and not [m for m in mailer.sent if m["title"].startswith("You have been outbid")]


# ---------------------------------------------------------------------------- spare parts
PART = {"name": "Front bumper", "make": "Maruti Suzuki", "model": "Swift", "year_from": 2018, "year_to": 2022,
        "condition": "used", "price": "4500", "stock": 2, "description": "Original, minor scratches"}


async def test_admin_manages_parts_and_the_public_catalogue_filters(api, storage):
    _, admin = await make_admin(api)
    tag = uuid.uuid4().hex[:6]
    created = await api.client.post("/api/admin/parts", headers=admin, json={**PART, "name": f"Bumper {tag}"})
    assert created.status_code == 201 and created.json()["price"] == "4500.00" and created.json()["has_photo"] is False
    pid = created.json()["id"]
    hidden = (await api.client.post("/api/admin/parts", headers=admin, json={**PART, "name": f"Mirror {tag}", "is_active": False})).json()
    any_model = (await api.client.post("/api/admin/parts", headers=admin, json={**PART, "name": f"Battery {tag}", "model": None,
                                                                                "year_from": None, "year_to": None})).json()

    async def names(query):
        res = await api.client.get(f"/api/parts?q={tag}&page_size=100&{query}")
        assert res.status_code == 200, res.text
        return {p["name"] for p in res.json()["items"]}

    assert await names("") == {f"Bumper {tag}", f"Battery {tag}"}                     # hidden part is not public
    assert await names("make=maruti&model=swift&year=2020") == {f"Bumper {tag}", f"Battery {tag}"}
    assert await names("model=baleno") == {f"Battery {tag}"}                           # fits-any-model part
    assert await names("year=2015") == {f"Battery {tag}"}
    assert (await api.client.get(f"/api/parts/{hidden['id']}")).status_code == 404

    for bad in ({**PART, "price": "0"}, {**PART, "stock": -1}, {**PART, "year_from": 2022, "year_to": 2018},
                {**PART, "name": "<b>"}, {**PART, "condition": "broken"}, {**PART, "extra": 1}):
        assert (await api.client.post("/api/admin/parts", headers=admin, json=bad)).status_code == 422, bad
    updated = await api.client.put(f"/api/admin/parts/{pid}", headers=admin, json={**PART, "name": f"Bumper {tag}", "price": "3999", "stock": 0})
    assert updated.status_code == 200 and updated.json()["price"] == "3999.00" and updated.json()["stock"] == 0

    photo = await api.client.post(f"/api/admin/parts/{pid}/photo", content=png(), headers={**admin, "Content-Type": "image/png"})
    assert photo.status_code == 200 and photo.json()["has_photo"] is True
    public = await api.client.get(f"/api/parts/{pid}/photo")
    assert public.status_code == 200 and public.headers["content-type"] == "image/png"
    assert (await api.client.get(f"/api/parts/{any_model['id']}/photo")).status_code == 404

    _, bidder, _ = await make_user(api, "bidder")
    assert (await api.client.post("/api/admin/parts", headers=bidder, json=PART)).status_code == 403


async def test_part_enquiry_admin_is_notified_and_calls_the_customer(api, storage):
    """Spare part enquiries: the customer leaves a phone number, admins are notified and call; nothing goes back."""
    admin_email, admin = await make_admin(api)
    admin_id = (await load_user(api, admin_email)).id
    _, user, uid = await make_user(api, "bidder")
    body = {"vehicle_make": "Hyundai", "vehicle_model": "i20", "vehicle_year": 2019, "part_name": "Left headlamp",
            "details": "Projector type", "contact_phone": "+91 98470 12345"}
    assert (await api.client.post("/api/part-requests", json=body)).status_code == 401
    assert (await api.client.post("/api/part-requests", headers=user, json={**body, "part_id": str(uuid.uuid4())})).status_code == 404
    assert (await api.client.post("/api/part-requests", headers=user, json={**body, "part_name": ""})).status_code == 422
    no_phone = {k: v for k, v in body.items() if k != "contact_phone"}
    assert (await api.client.post("/api/part-requests", headers=user, json=no_phone)).status_code == 422
    assert (await api.client.post("/api/part-requests", headers=user, json={**body, "contact_phone": "call me"})).status_code == 422
    created = await api.client.post("/api/part-requests", headers=user, json=body)
    assert created.status_code == 201 and created.json()["status"] == "new" and created.json()["number"].startswith("PRQ-")
    rid = created.json()["id"]
    assert "part_request_new" in await kinds_for(api, admin_id)
    async with api.db() as db:
        sent = (await db.execute(select(Notification).where(Notification.user_id == admin_id,
                                                            Notification.kind == "part_request_new"))).scalar_one()
    assert sent.link == f"/admin?tab=part-enquiries&status=new&open={rid}" and "+91 98470 12345" in sent.body

    inbox = (await api.client.get("/api/admin/part-requests?status=new&page_size=100", headers=admin)).json()
    row = next(i for i in inbox["items"] if i["id"] == rid)
    assert row["user_id"] == str(uid) and row["user_email"] and row["contact_phone"] == "+91 98470 12345"
    assert row["buyer_id"].startswith("SLX-")
    for q in ("headlamp", "98470", row["buyer_id"]):
        found = (await api.client.get(f"/api/admin/part-requests?q={q}&page_size=100", headers=admin)).json()["items"]
        assert any(i["id"] == rid for i in found), q

    done = await api.client.post(f"/api/admin/part-requests/{rid}/update", headers=admin,
                                 json={"status": "contacted", "admin_note": "Rs 2,800, collects Monday"})
    assert done.status_code == 200 and done.json()["status"] == "contacted" and done.json()["admin_note"] == "Rs 2,800, collects Monday"
    async with api.db() as db:
        to_customer = (await db.execute(select(Notification).where(Notification.user_id == uid))).scalars().all()
    assert to_customer == []                                   # the team calls; the website sends nothing
    mine = (await api.client.get("/api/part-requests/mine", headers=user)).json()["items"]
    assert mine[0]["status"] == "contacted" and "admin_note" not in mine[0] and "quoted_price" not in mine[0]
    assert (await api.client.post(f"/api/admin/part-requests/{rid}/update", headers=admin, json={})).status_code == 422
    for old in ("quoted", "ready", "cancelled"):
        assert (await api.client.post(f"/api/admin/part-requests/{rid}/update", headers=admin, json={"status": old})).status_code == 422
    assert (await api.client.post(f"/api/admin/part-requests/{rid}/update", headers=admin, json={"status": "closed"})).status_code == 200
    # a closed enquiry can be opened again
    assert (await api.client.post(f"/api/admin/part-requests/{rid}/update", headers=admin,
                                  json={"status": "new"})).json()["status"] == "new"
