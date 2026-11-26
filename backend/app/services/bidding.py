"""
The bidding engine (Module 6).

Placing a bid is ONE database transaction:
  1. a repeated request (same bidder + Idempotency-Key) returns the bid it already created;
  2. the auction row is locked (SELECT ... FOR UPDATE), so bids on one auction are handled strictly one
     after another - two bids can never both "win" the same moment;
  3. checks against the SERVER clock and the locked row: the auction is live; the bidder is an active,
     KYC-verified bidder (re-read now, not from the start of the request) and not the seller;
  4. amount rule (company decision): the first bid must be at least the starting price, every later bid
     only has to be higher than the current highest bid; the current highest bidder cannot bid again;
  5. the bid is stored (append-only), the auction's current price / winner / count are updated, and the
     late-bid time extension is applied when the admin switched it on;
  6. one commit.
"""
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import record_audit
from app.core.errors import ApiError
from app.models.auction import Auction
from app.models.auction_bid import AuctionBid
from app.models.user import User
from app.models.vehicle import Vehicle
from app.services.orders import bidding_refusal
from app.services.notifications import notify, notify_admins


@dataclass
class BidOutcome:
    bid: AuctionBid
    auction: Auction
    extended: bool
    repeated: bool          # True when this was a repeat of an earlier request with the same key


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


async def _existing_by_key(db: AsyncSession, bidder_id: uuid.UUID, key: Optional[str]) -> Optional[AuctionBid]:
    if not key:
        return None
    return (await db.execute(
        select(AuctionBid).where(AuctionBid.bidder_id == bidder_id, AuctionBid.idempotency_key == key)
    )).scalar_one_or_none()


async def _repeat(db: AsyncSession, bid: AuctionBid, auction_id: uuid.UUID) -> BidOutcome:
    if bid.auction_id != auction_id:
        raise ApiError(409, "This request key was already used for another auction.", "idempotency_key_reused")
    auction = (await db.execute(
        select(Auction).where(Auction.id == auction_id).execution_options(populate_existing=True)
    )).scalar_one()
    return BidOutcome(bid=bid, auction=auction, extended=False, repeated=True)


async def place_bid(db: AsyncSession, bidder: User, auction_id: uuid.UUID, amount: Decimal,
                    idempotency_key: Optional[str]) -> BidOutcome:
    earlier = await _existing_by_key(db, bidder.id, idempotency_key)
    if earlier is not None:
        return await _repeat(db, earlier, auction_id)

    auction = (await db.execute(
        select(Auction).where(Auction.id == auction_id).with_for_update().execution_options(populate_existing=True)
    )).scalar_one_or_none()
    if auction is None or auction.status == "cancelled":
        raise ApiError(404, "Auction not found.", "auction_not_found")
    # The same request may have been committed by a twin request while we waited for the lock.
    earlier = await _existing_by_key(db, bidder.id, idempotency_key)
    if earlier is not None:
        return await _repeat(db, earlier, auction_id)

    # Re-read the bidder now that the auction is locked (rights or KYC may have changed meanwhile).
    current = (await db.execute(
        select(User).where(User.id == bidder.id).execution_options(populate_existing=True)
    )).scalar_one()
    if not current.is_active or current.role != "bidder":
        raise ApiError(403, "Access denied. You do not have permission to do this.", "forbidden")
    if current.kyc_status != "verified":
        raise ApiError(403, "Your identity must be verified (KYC) before you can bid.", "kyc_required")
    refusal = await bidding_refusal(db, current)        # unpaid win, or bidding blocked after a default
    if refusal is not None:
        raise refusal

    now = now_utc()
    if auction.phase(now) != "live":
        raise ApiError(409, "This auction is not open for bidding right now.", "auction_not_live")
    seller_id = (await db.execute(select(Vehicle.owner_id).where(Vehicle.id == auction.vehicle_id))).scalar_one()
    if seller_id == bidder.id:
        raise ApiError(403, "You cannot bid on your own vehicle.", "own_vehicle")
    if auction.current_winner_id == bidder.id:
        raise ApiError(409, "You are already the highest bidder.", "already_highest")
    if auction.current_price is None:
        if amount < auction.starting_price:
            # The starting price is hidden from bidders (client, 2026-11-26), so the refusal must not
            # contain it: a bidder could otherwise find it by bidding 1 and reading the message back.
            raise ApiError(409, "Your bid is lower than the expected price. Kindly increase your bid.",
                           "bid_below_starting_price")
    elif amount <= auction.current_price:
        raise ApiError(409, f"Your bid must be higher than the current bid of {auction.current_price}.", "bid_too_low")

    previous_leader = auction.current_winner_id
    bid = AuctionBid(auction_id=auction.id, bidder_id=bidder.id, amount=amount, created_at=now,
                     idempotency_key=idempotency_key)
    db.add(bid)
    auction.current_price = amount
    auction.current_winner_id = bidder.id
    auction.bid_count += 1

    extended = False
    if auction.extension_enabled:
        window = timedelta(minutes=auction.extension_minutes)
        if auction.ends_at - now < window:
            old_end = auction.ends_at
            auction.ends_at = now + window
            extended = True
    try:
        await db.flush()
    except IntegrityError:
        # Only a repeat of the same key can get here (the lock rules out equal amounts): return that bid.
        await db.rollback()
        earlier = await _existing_by_key(db, bidder.id, idempotency_key)
        if earlier is None:
            raise
        return await _repeat(db, earlier, auction_id)
    if previous_leader is not None and previous_leader != bidder.id:
        await notify(db, previous_leader, "outbid", "You have been outbid",
                     f"Someone bid {amount} on an auction you were leading. Bid again before it ends.", f"/auctions/{auction.id}")
    if extended:
        await record_audit(db, actor=bidder, action="auction.auto_extend", target_type="auction", target_id=auction.id,
                           details={"bid_id": bid.id, "old_ends_at": old_end.isoformat(), "new_ends_at": auction.ends_at.isoformat()})
    return BidOutcome(bid=bid, auction=auction, extended=extended, repeated=False)


async def bidder_labels(db: AsyncSession, auction_id: uuid.UUID) -> dict:
    """Public pseudonyms: 'Bidder 1' is whoever bid first on this auction, and so on. Names are never shown."""
    rows = (await db.execute(
        select(AuctionBid.bidder_id, func.min(AuctionBid.created_at).label("first"))
        .where(AuctionBid.auction_id == auction_id).group_by(AuctionBid.bidder_id).order_by("first", AuctionBid.bidder_id)
    )).all()
    return {row.bidder_id: f"Bidder {n}" for n, row in enumerate(rows, start=1)}
