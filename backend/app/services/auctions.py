"""
Auction administration (Module 5). Functions add changes and audit entries to the caller's session
WITHOUT committing; the route commits once. The audit log (target_type "auction") is the auction's history.

Locking: the auction (or, on create, the vehicle) row first, then the acting admin's user row. Other modules
lock user rows only after their own rows, and Module 2 locks only user rows, so there is no lock cycle.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.audit import record_audit
from app.core.config import settings
from app.core.errors import ApiError
from app.models.auction import OPEN_STATUSES, Auction
from app.models.auction_bid import AuctionBid
from app.models.order import Order
from app.models.user import User
from app.models.vehicle import Vehicle
from app.services.orders import create_order_for
from app.services.notifications import notify, notify_admins

START_GRACE = timedelta(seconds=60)      # an auction may be set to start "now" despite a few seconds' delay


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _not_found() -> ApiError:
    return ApiError(404, "Auction not found.", "auction_not_found")


async def load_auction(db: AsyncSession, auction_id: uuid.UUID) -> Optional[Auction]:
    stmt = (select(Auction).where(Auction.id == auction_id)
            .options(selectinload(Auction.vehicle).selectinload(Vehicle.photos)))
    return (await db.execute(stmt.execution_options(populate_existing=True))).scalar_one_or_none()


async def _lock(db: AsyncSession, auction_id: uuid.UUID) -> Auction:
    auction = (await db.execute(
        select(Auction).where(Auction.id == auction_id).with_for_update().execution_options(populate_existing=True)
    )).scalar_one_or_none()
    if auction is None:
        raise _not_found()
    return auction


async def _recheck_admin(db: AsyncSession, actor: User) -> None:
    row = (await db.execute(
        select(User).where(User.id == actor.id).with_for_update().execution_options(populate_existing=True)
    )).scalar_one_or_none()
    if row is None or row.role != "admin" or not row.is_active:
        raise ApiError(403, "Access denied. You do not have permission to do this.", "forbidden")


def _require_open(auction: Auction) -> None:
    if auction.status not in OPEN_STATUSES:
        raise ApiError(409, f"This auction is {auction.status}.", "auction_not_open")


def _check_window(starts_at: datetime, ends_at: datetime, now: datetime, check_start: bool = True) -> None:
    if check_start and starts_at < now - START_GRACE:
        raise ApiError(422, "The start time is in the past.", "invalid_schedule")
    duration = ends_at - starts_at
    if duration < timedelta(minutes=settings.AUCTION_MIN_DURATION_MINUTES):
        raise ApiError(422, f"An auction must last at least {settings.AUCTION_MIN_DURATION_MINUTES} minutes.", "invalid_schedule")
    if duration > timedelta(days=settings.AUCTION_MAX_DURATION_DAYS):
        raise ApiError(422, f"An auction can last at most {settings.AUCTION_MAX_DURATION_DAYS} days.", "invalid_schedule")


async def _audit(db: AsyncSession, actor: Optional[User], action: str, auction: Auction, **details) -> None:
    await record_audit(db, actor=actor, action=f"auction.{action}", target_type="auction", target_id=auction.id,
                       details=details)


IST = timezone(timedelta(hours=5, minutes=30))


def _when(value: datetime) -> str:
    """'25 Oct, 11:07 am' in Indian time, for messages."""
    t = value.astimezone(IST)
    return f"{t.day} {t.strftime('%b')}, {t.strftime('%I:%M').lstrip('0')} {t.strftime('%p').lower()}"


async def _vehicle_title(db: AsyncSession, auction: Auction) -> str:
    v = (await db.execute(select(Vehicle).where(Vehicle.id == auction.vehicle_id))).scalar_one()
    return f"{v.manufacturing_year} {v.make} {v.model} {v.variant}"


async def notify_bidders(db: AsyncSession, auction: Auction, kind: str, title: str, body: str,
                         exclude: Optional[uuid.UUID] = None) -> int:
    """Tell everyone who bid on this auction (once each) about a change: pause, resume, extension, cancel, result."""
    ids = (await db.execute(select(AuctionBid.bidder_id).where(AuctionBid.auction_id == auction.id).distinct())).scalars().all()
    sent = 0
    for bidder_id in ids:
        if bidder_id != exclude:
            await notify(db, bidder_id, kind, title, body, f"/auctions/{auction.id}")
            sent += 1
    return sent


def _iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def sold_by_auction(vehicle_id_column):
    """SQL condition: the vehicle was sold in an auction (and the sale was not defaulted / cancelled)."""
    released = select(Order.id).where(Order.auction_id == Auction.id, Order.status.in_(("defaulted", "cancelled")))
    return select(Auction.id).where(Auction.vehicle_id == vehicle_id_column, Auction.result == "sold",
                                    ~released.exists()).exists()


async def vehicle_locked_by_auction(db: AsyncSession, vehicle_id: uuid.UUID) -> bool:
    """A vehicle in an open auction, or sold (unless the sale defaulted / was cancelled), cannot change."""
    released = select(Order.id).where(Order.auction_id == Auction.id, Order.status.in_(("defaulted", "cancelled")))
    found = (await db.execute(
        select(Auction.id).where(Auction.vehicle_id == vehicle_id)
        .where(Auction.status.in_(OPEN_STATUSES) | ((Auction.result == "sold") & ~released.exists())).limit(1)
    )).first()
    return found is not None


async def open_auction_exists(db: AsyncSession, vehicle_id: uuid.UUID) -> bool:
    """True while this vehicle has an auction that has not finished (scheduled or paused)."""
    return (await db.execute(
        select(Auction.id).where(Auction.vehicle_id == vehicle_id, Auction.status.in_(OPEN_STATUSES)).limit(1)
    )).first() is not None


async def live_sale_order(db: AsyncSession, vehicle_id: uuid.UUID):
    """
    The order for a sale of this vehicle that is still standing, or None.

    A vehicle may be auctioned again as often as the company likes (client, 2026-11-26): a finished
    auction never blocks the next one. The ONE thing that does is a sale that still stands - the same
    vehicle must not be promised to two buyers. Cancelling that order (Orders screen, which also tells
    the buyer) releases the vehicle at once.
    """
    return (await db.execute(
        select(Order).join(Auction, Auction.id == Order.auction_id)
        .where(Auction.vehicle_id == vehicle_id, Auction.result == "sold")
        .where(Order.status.not_in(("defaulted", "cancelled")))
        .order_by(Order.created_at.desc()).limit(1)
    )).scalar_one_or_none()


async def require_free_to_relist(db: AsyncSession, vehicle_id: uuid.UUID, what: str) -> None:
    """Raise unless this vehicle can go into a new auction (or change listing) right now."""
    if await open_auction_exists(db, vehicle_id):
        raise ApiError(409, f"This vehicle already has an auction that has not finished. "
                            f"Close or cancel it before you {what}.", "vehicle_already_auctioned")
    order = await live_sale_order(db, vehicle_id)
    if order is not None:
        raise ApiError(409, f"This vehicle was sold in an earlier auction and order {order.number} still "
                            f"stands. Cancel that order on the Orders screen, then you can {what}.",
                       "vehicle_sale_still_open")


# ---------------------------------------------------------------------------- create and edit
async def create_auction(db: AsyncSession, actor: User, data: dict) -> Auction:
    now = now_utc()
    vehicle = (await db.execute(
        select(Vehicle).where(Vehicle.id == data["vehicle_id"]).with_for_update()
    )).scalar_one_or_none()
    if vehicle is None:
        raise ApiError(404, "Vehicle not found.", "vehicle_not_found")
    await _recheck_admin(db, actor)
    if vehicle.status != "approved":
        raise ApiError(409, "Only approved vehicles can be auctioned.", "vehicle_not_approved")
    if vehicle.listing_type == "ready_to_lift":
        raise ApiError(409, "Ready to Lift vehicles are not auctioned. Change the listing to Auction first.",
                       "ready_to_lift_not_auctioned")
    # A vehicle may be auctioned as many times as the company likes; only an unfinished auction or a
    # sale that still stands gets in the way (client, 2026-11-26).
    await require_free_to_relist(db, vehicle.id, "auction it again")
    _check_window(data["starts_at"], data["ends_at"], now)
    minutes = data.get("extension_minutes") or settings.AUCTION_DEFAULT_EXTENSION_MINUTES
    auction = Auction(
        vehicle_id=vehicle.id, status="scheduled", starting_price=data["starting_price"],
        starting_price_without_rc=data.get("starting_price_without_rc"),
        starts_at=data["starts_at"], ends_at=data["ends_at"], scheduled_ends_at=data["ends_at"],
        extension_enabled=data.get("extension_enabled", False), extension_minutes=minutes, created_by_id=actor.id,
    )
    db.add(auction)
    try:
        await db.flush()
    except IntegrityError:            # a simultaneous request opened an auction for this vehicle first
        await db.rollback()
        raise ApiError(409, "This vehicle already has an open auction.", "vehicle_already_auctioned") from None
    await _audit(db, actor, "create", auction, vehicle_id=vehicle.id, starting_price=str(auction.starting_price),
                 starting_price_without_rc=(str(auction.starting_price_without_rc)
                                            if auction.starting_price_without_rc is not None else None),
                 starts_at=_iso(auction.starts_at), ends_at=_iso(auction.ends_at),
                 extension_enabled=auction.extension_enabled, extension_minutes=minutes)
    return auction


async def update_auction(db: AsyncSession, actor: User, auction_id: uuid.UUID, changes: dict) -> Auction:
    now = now_utc()
    auction = await _lock(db, auction_id)
    await _recheck_admin(db, actor)
    _require_open(auction)
    schedule_fields = {"starting_price", "starting_price_without_rc", "starts_at", "ends_at"} & set(changes)
    if schedule_fields and (auction.phase(now) != "upcoming"
                            or auction.bid_count > 0 or auction.bid_count_without_rc > 0):
        raise ApiError(409, "Price and times can only be changed before the auction starts.", "auction_started")
    if schedule_fields & {"starts_at", "ends_at"}:
        _check_window(changes.get("starts_at", auction.starts_at), changes.get("ends_at", auction.ends_at), now)
    changed = {}
    for name, value in changes.items():
        if getattr(auction, name) != value:
            setattr(auction, name, value)
            changed[name] = _iso(value) if isinstance(value, datetime) else (str(value) if not isinstance(value, (bool, int)) else value)
    if "ends_at" in changed:
        auction.scheduled_ends_at = auction.ends_at
    if changed:
        await db.flush()
        await _audit(db, actor, "update", auction, changes=changed)
    return auction


# ---------------------------------------------------------------------------- lifecycle actions
async def pause_auction(db: AsyncSession, actor: User, auction_id: uuid.UUID, reason: str) -> Auction:
    now = now_utc()
    auction = await _lock(db, auction_id)
    await _recheck_admin(db, actor)
    if auction.status != "scheduled" or auction.phase(now) == "closing":
        raise ApiError(409, "Only an upcoming or live auction can be paused.", "auction_not_pausable")
    auction.status = "paused"
    auction.paused_at = now
    await _audit(db, actor, "pause", auction, reason=reason, phase_when_paused="live" if now >= auction.starts_at else "upcoming")
    await notify_bidders(db, auction, "auction_paused", f"Auction paused: {await _vehicle_title(db, auction)}",
                         "The organiser has paused this auction. Bidding is on hold; we will tell you when it resumes. "
                         "Your bids still count.")
    return auction


async def resume_auction(db: AsyncSession, actor: User, auction_id: uuid.UUID, reason: Optional[str]) -> Auction:
    """The clock stood still while paused: the end (and a not-yet-reached start) move forward by the pause."""
    now = now_utc()
    auction = await _lock(db, auction_id)
    await _recheck_admin(db, actor)
    if auction.status != "paused":
        raise ApiError(409, "This auction is not paused.", "auction_not_paused")
    paused_for = now - auction.paused_at
    if auction.paused_at < auction.starts_at:
        auction.starts_at += paused_for
    auction.ends_at += paused_for
    auction.status = "scheduled"
    auction.paused_at = None
    await _audit(db, actor, "resume", auction, reason=reason, paused_seconds=int(paused_for.total_seconds()),
                 new_ends_at=_iso(auction.ends_at))
    await notify_bidders(db, auction, "auction_resumed", f"Auction resumed: {await _vehicle_title(db, auction)}",
                         f"Bidding is open again. The auction now ends {_when(auction.ends_at)}.")
    return auction


async def extend_auction(db: AsyncSession, actor: User, auction_id: uuid.UUID, minutes: int, reason: str) -> Auction:
    now = now_utc()
    auction = await _lock(db, auction_id)
    await _recheck_admin(db, actor)
    _require_open(auction)
    old = auction.ends_at
    auction.ends_at = max(auction.ends_at, now) + timedelta(minutes=minutes)
    if auction.ends_at - auction.starts_at > timedelta(days=settings.AUCTION_MAX_DURATION_DAYS):
        raise ApiError(422, f"An auction can last at most {settings.AUCTION_MAX_DURATION_DAYS} days.", "invalid_schedule")
    await _audit(db, actor, "extend", auction, reason=reason, minutes=minutes, old_ends_at=_iso(old), new_ends_at=_iso(auction.ends_at))
    await notify_bidders(db, auction, "auction_extended", f"More time: {await _vehicle_title(db, auction)}",
                         f"The organiser extended this auction. It now ends {_when(auction.ends_at)}.")
    return auction


async def cancel_auction(db: AsyncSession, actor: User, auction_id: uuid.UUID, reason: str) -> Auction:
    auction = await _lock(db, auction_id)
    await _recheck_admin(db, actor)
    _require_open(auction)
    auction.status = "cancelled"
    auction.paused_at = None
    auction.closed_at = now_utc()
    await _audit(db, actor, "cancel", auction, reason=reason, bid_count=auction.bid_count)
    await notify_bidders(db, auction, "auction_cancelled", f"Auction cancelled: {await _vehicle_title(db, auction)}",
                         "The organiser cancelled this auction. Your bids no longer count and nothing is owed.")
    return auction


async def finish_auction(db: AsyncSession, auction: Auction, actor: Optional[User], reason: Optional[str]) -> Auction:
    """
    Close a LOCKED open auction and decide the result: sold to the highest bidder, or no_sale. Used by the
    admin's early close and by the automatic closer (Module 7, actor None = system).
    """
    auction.status = "closed"
    auction.result = "sold" if auction.current_winner_id else "no_sale"
    auction.paused_at = None
    auction.closed_at = now_utc()
    await db.flush()
    order = await create_order_for(db, auction)  # the winner's order, in this same transaction
    vehicle = (await db.execute(select(Vehicle).where(Vehicle.id == auction.vehicle_id))).scalar_one()
    title = f"{vehicle.manufacturing_year} {vehicle.make} {vehicle.model} {vehicle.variant} ({vehicle.registration_number})"
    # Both rates go to the insurer, so the Without RC ladder's best bid is reported even though the
    # order is made for the With RC winner (client, 2026-11-26).
    without_rc = ""
    if auction.current_price_without_rc is not None:
        other = (await db.execute(select(User).where(User.id == auction.current_winner_without_rc_id))).scalar_one()
        without_rc = (f" Best Without RC rate: {auction.current_price_without_rc} "
                      f"({other.name}, {other.buyer_id or other.email}).")
    if order is not None:
        winner = (await db.execute(select(User).where(User.id == order.buyer_id))).scalar_one()
        await notify_admins(db, "auction_won", f"{title} sold",
                            f"Winner (With RC): {winner.name} ({winner.buyer_id or winner.email}"
                            f"{', ' + winner.mobile if winner.mobile else ''}). Winning bid {order.amount}. "
                            + (f"Order {order.number} is awaiting payment." if settings.ONLINE_PAYMENT_FLOW
                               else "Contact the buyer to complete the deal.") + without_rc,
                            f"/admin?tab=results&status=sold&open={auction.id}")
    else:
        await notify_admins(db, "auction_no_sale", f"{title}: no sale",
                            "The auction ended without a With RC bid." + (without_rc or ""),
                            f"/admin?tab=results&status=no_sale&open={auction.id}")
    if order is not None:
        name = f"{vehicle.manufacturing_year} {vehicle.make} {vehicle.model} {vehicle.variant}"
        if settings.ONLINE_PAYMENT_FLOW:
            won_text = f"{name}: your winning bid is {order.amount}. Order {order.number}: please pay by {_when(order.due_at)}."
        else:
            won_text = (f"{name}: your winning bid is {order.amount}. Our team will contact you shortly to complete the "
                        f"purchase (reference {order.number}).")
        await notify(db, order.buyer_id, "auction_won", "You won the auction!", won_text, "/dashboard?tab=won")
        await notify_bidders(db, auction, "auction_lost",
                             f"Auction ended: {vehicle.manufacturing_year} {vehicle.make} {vehicle.model} {vehicle.variant}",
                             f"The auction closed at {order.amount}. Another bidder won this time.",
                             exclude=order.buyer_id)
        owner_role = (await db.execute(select(User.role).where(User.id == vehicle.owner_id))).scalar_one()
        if owner_role != "admin":      # admins already got the "... sold" notice above; one message per sale
            await notify(db, vehicle.owner_id, "vehicle_sold", "Your vehicle sold",
                         f"The auction closed with a winning bid of {order.amount}.", "/seller/dashboard")
    await _audit(db, actor, "close", auction, reason=reason, result=auction.result, bid_count=auction.bid_count,
                 final_price=str(auction.current_price) if auction.current_price is not None else None,
                 winner_id=auction.current_winner_id, bid_count_without_rc=auction.bid_count_without_rc,
                 final_price_without_rc=(str(auction.current_price_without_rc)
                                         if auction.current_price_without_rc is not None else None),
                 winner_without_rc_id=auction.current_winner_without_rc_id)
    return auction


async def close_auction(db: AsyncSession, actor: User, auction_id: uuid.UUID, reason: str) -> Auction:
    """Admin closes an auction now (even before its end time)."""
    now = now_utc()
    auction = await _lock(db, auction_id)
    await _recheck_admin(db, actor)
    _require_open(auction)
    if auction.ends_at > now:
        auction.ends_at = max(now, auction.starts_at + timedelta(microseconds=1))
    return await finish_auction(db, auction, actor, reason)
