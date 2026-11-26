"""
Public auction routes (no sign-in): live, upcoming and ended auctions with their vehicle. Cancelled
auctions are not listed. Each item carries the server time for countdowns.
"""
import math
import uuid
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, Query, Request, Response
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import AuthContext, get_auth_context, get_current_user_optional, require_csrf, require_role, require_verified_email, require_verified_kyc, require_verified_mobile
from app.api.pagination import PaginationParams, paginate, pagination_params
from app.core.errors import ApiError
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.models.auction import Auction
from app.models.auction_bid import AuctionBid
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.auctions import AuctionPublic
from app.schemas.bids import BidRequest, BidResult, MyBidRow, PublicBid
from app.schemas.common import Page
from app.services import bidding
from app.services.auctions import load_auction, now_utc

router = APIRouter(prefix="/api/auctions", tags=["Auctions"])


@router.get("", response_model=Page[AuctionPublic], summary="Live (ending soonest first), upcoming or ended auctions")
async def list_auctions(
    request: Request,
    phase: Literal["live", "upcoming", "ended"] = Query("live"),
    category: Optional[Literal["insurance", "bank_nbfc", "used_vehicle"]] = Query(None),
    params: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
):
    enforce_rate_limit("session", request)
    now = now_utc()
    stmt = select(Auction).options(selectinload(Auction.vehicle).selectinload(Vehicle.photos))
    if category:
        stmt = stmt.join(Vehicle, Vehicle.id == Auction.vehicle_id).where(Vehicle.category == category)
    if phase == "live":
        stmt = stmt.where(or_(
            and_(Auction.status == "scheduled", Auction.starts_at <= now, Auction.ends_at > now),
            and_(Auction.status == "paused", Auction.starts_at <= Auction.paused_at),
        )).order_by(Auction.ends_at.asc(), Auction.id)
    elif phase == "upcoming":
        stmt = stmt.where(or_(
            and_(Auction.status == "scheduled", Auction.starts_at > now),
            and_(Auction.status == "paused", Auction.paused_at < Auction.starts_at),
        )).order_by(Auction.starts_at.asc(), Auction.id)
    else:
        stmt = stmt.where(Auction.status == "closed").order_by(Auction.closed_at.desc(), Auction.id)
    return await paginate(db, stmt, params, AuctionPublic, transform=lambda a: AuctionPublic.build(a, now))


@router.get("/{auction_id}", response_model=AuctionPublic, summary="One auction")
async def get_auction(auction_id: uuid.UUID, request: Request, db: AsyncSession = Depends(get_db)):
    enforce_rate_limit("session", request)
    auction = await load_auction(db, auction_id)
    if auction is None or auction.status == "cancelled":
        raise ApiError(404, "Auction not found.", "auction_not_found")
    return AuctionPublic.build(auction, now_utc())


# ---------------------------------------------------------------------------- bidding
@router.post("/{auction_id}/bids", response_model=BidResult, status_code=201,
             dependencies=[Depends(require_role(["bidder"])), Depends(require_verified_kyc), Depends(require_verified_mobile), Depends(require_verified_email)],
             summary="Place a bid (KYC-verified bidders). Send an Idempotency-Key header so a double click counts once.")
async def place_bid(
    auction_id: uuid.UUID,
    body: BidRequest,
    request: Request,
    response: Response,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key", pattern=r"^[A-Za-z0-9_\-]{8,64}$"),
    ctx: AuthContext = Depends(require_csrf),
    db: AsyncSession = Depends(get_db),
):
    enforce_rate_limit("bid", request, ctx.user.email)
    outcome = await bidding.place_bid(db, ctx.user, auction_id, body.amount, idempotency_key, body.rc_option)
    await db.commit()
    if outcome.repeated:
        response.status_code = 200
    auction, now = outcome.auction, now_utc()
    ladder = bidding.LADDERS[outcome.bid.rc_option]            # the ladder this bid went into
    return BidResult(
        bid_id=outcome.bid.id, amount=outcome.bid.amount, rc_option=outcome.bid.rc_option,
        placed_at=outcome.bid.created_at, auction_id=auction.id,
        phase=auction.phase(now), current_price=getattr(auction, ladder.price), bid_count=getattr(auction, ladder.count),
        ends_at=auction.ends_at, time_extended=outcome.extended,
        you_are_highest=getattr(auction, ladder.winner) == ctx.user.id, repeated=outcome.repeated, server_time=now,
    )


@router.get("/{auction_id}/bids", response_model=Page[PublicBid], summary="Bid history, newest first (names hidden)")
async def bid_history(
    auction_id: uuid.UUID,
    request: Request,
    params: PaginationParams = Depends(pagination_params),
    viewer: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    enforce_rate_limit("session", request)
    status = (await db.execute(select(Auction.status).where(Auction.id == auction_id))).scalar_one_or_none()
    if status is None or status == "cancelled":
        raise ApiError(404, "Auction not found.", "auction_not_found")
    labels = await bidding.bidder_labels(db, auction_id)
    stmt = (select(AuctionBid).where(AuctionBid.auction_id == auction_id)
            .order_by(AuctionBid.created_at.desc(), AuctionBid.amount.desc()))
    return await paginate(db, stmt, params, PublicBid, transform=lambda b: PublicBid(
        amount=b.amount, rc_option=b.rc_option, placed_at=b.created_at, bidder=labels.get(b.bidder_id, "Bidder"),
        is_you=viewer is not None and b.bidder_id == viewer.id))


bids_router = APIRouter(prefix="/api/bids", tags=["Bids"])


@bids_router.get("/mine", response_model=Page[MyBidRow], dependencies=[Depends(require_role(["bidder"]))],
                 summary="Auctions you have bid on (most recent activity first)")
async def my_bids(
    request: Request,
    params: PaginationParams = Depends(pagination_params),
    ctx: AuthContext = Depends(get_auth_context),
    db: AsyncSession = Depends(get_db),
):
    enforce_rate_limit("session", request)
    mine = (select(AuctionBid.auction_id, func.max(AuctionBid.amount).label("my_max"),
                   func.max(AuctionBid.created_at).label("last_bid"))
            .where(AuctionBid.bidder_id == ctx.user.id).group_by(AuctionBid.auction_id).subquery())
    stmt = (select(Auction, mine.c.my_max).join(mine, mine.c.auction_id == Auction.id)
            .options(selectinload(Auction.vehicle).selectinload(Vehicle.photos)).order_by(mine.c.last_bid.desc(), Auction.id))
    now = now_utc()
    total = (await db.execute(select(func.count()).select_from(mine))).scalar_one()
    rows = (await db.execute(stmt.limit(params.page_size).offset(params.offset))).all()
    items = []
    for auction, my_max in rows:
        vehicle = auction.vehicle
        items.append(MyBidRow(
            auction_id=auction.id, vehicle_id=vehicle.id,
            title=f"{vehicle.manufacturing_year} {vehicle.make} {vehicle.model} {vehicle.variant}",
            registration_number=vehicle.registration_number, my_highest_bid=my_max,
            current_price=auction.current_price, phase=auction.phase(now), result=auction.result,
            ends_at=auction.ends_at, you_are_highest=auction.current_winner_id == ctx.user.id,
            you_won=auction.result == "sold" and auction.current_winner_id == ctx.user.id, server_time=now,
            photo_id=vehicle.photos[0].id if vehicle.photos else None,
        ))
    return Page[MyBidRow](items=items, page=params.page, page_size=params.page_size, total=total,
                          pages=math.ceil(total / params.page_size) if total else 0)
