"""
Administrator API. EVERY route in this router requires a signed-in user whose role in the database is
"admin": anonymous callers get 401 and everyone else gets 403. The check is attached to the router, so a
new route added here is protected automatically (and tests/test_admin_foundation.py proves it for every
route under /api/admin).

Rules for routes added here:
  * state-changing routes must also depend on `require_csrf` (see app/api/deps.py);
  * every sensitive change must call `record_audit` (app/core/audit.py) and commit once, so the change
    and its audit entry are stored in the same transaction;
  * list routes must use `pagination_params` / `paginate` (app/api/pagination.py).
"""
import uuid
from decimal import Decimal
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import AuthContext, require_csrf, require_role
from app.api.pagination import PaginationParams, paginate, pagination_params
from app.core.errors import ApiError
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.contact import CONTACT_STATUSES, ContactMessage
from app.models.auction import AUCTION_STATUSES, OPEN_STATUSES as OPEN_AUCTION_STATUSES, Auction
from app.models.auction_bid import AuctionBid
from app.models.kyc import SUBMISSION_STATUSES, KycSubmission
from app.models.order import ORDER_STATUSES, Order
from app.models.spare_part import REQUEST_STATUSES, PartRequest, SparePart
from app.models.vehicle import VEHICLE_STATUSES, Vehicle, VehiclePhoto
from app.models.fee_payment import FeePayment
from app.models.enquiry import ENQUIRY_STATUSES, VehicleEnquiry
from app.models.user import User, format_buyer_id, parse_buyer_id
from app.schemas.admin import (
    AdminDashboard,
    AdminUserDetail,
    AdminUserOut,
    AuditLogOut,
    ChangeRoleRequest,
    ReactivateUserRequest,
    SuspendUserRequest,
)
from app.schemas.auctions import (
    AdminResultBid,
    AdminResultDetail,
    AdminResultRow,
    AdminAuctionDetail,
    AdminAuctionOut,
    AuctionCreate,
    AuctionHistoryEntry,
    AuctionUpdate,
    ExtendRequest,
    OptionalReasonRequest,
    ReasonRequest,
)
from app.schemas.bids import AdminBid
from app.schemas.common import Page
from app.schemas.contact import AdminContactOut, ContactUpdate
from app.schemas.deals import DealOut, DealUpdate, FeePaymentCreate, FeePaymentOut, MonthlyReport
from app.schemas.enquiries import AdminEnquiryOut, EnquiryUpdate
from app.schemas.parts import AdminPartRequestOut, PartOut, PartRequestOut, PartRequestUpdate, PartWrite
from app.schemas.orders import AdminOrderOut, OrderReasonRequest
from app.schemas.kyc import AdminKycSubmissionDetail, AdminKycSubmissionRow, KycDecisionRequest
from app.schemas.vehicles import AdminVehicleOut, AdminVehicleRow, VehicleReviewRequest
from app.api.orders import load_order
from app.api.parts import count as parts_count
from app.api.parts import page_of as parts_page
from app.api.uploads import read_body_capped
from app.core.audit import record_audit
from app.core.config import settings
from app.services.image_meta import strip_metadata
from app.services.kyc_files import JPEG, PNG, validate_upload
from app.services.storage import PrivateStorage, get_private_storage
from app.services import auctions as auction_service
from app.services import orders as order_service
from app.services import kyc as kyc_service
from app.services import user_management
from app.services import vehicles as vehicle_service
from app.services import deals as deal_service
from app.services.aadhaar import masked
from app.services import reports as report_service

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_role(["admin"]))],
)

_NAME = r"^[A-Za-z0-9_.\-]+$"


@router.get(
    "/audit-logs",
    response_model=Page[AuditLogOut],
    summary="List the audit trail, newest first (read-only)",
)
async def list_audit_logs(
    params: PaginationParams = Depends(pagination_params),
    action: Optional[str] = Query(None, max_length=64, pattern=_NAME, description="Only this action, e.g. user.suspend"),
    target_type: Optional[str] = Query(None, max_length=50, pattern=_NAME),
    target_id: Optional[str] = Query(None, max_length=64, pattern=_NAME),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AuditLog)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if target_type:
        stmt = stmt.where(AuditLog.target_type == target_type)
    if target_id:
        stmt = stmt.where(AuditLog.target_id == target_id)
    stmt = stmt.order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
    return await paginate(db, stmt, params, AuditLogOut)


# ---------------------------------------------------------------------------- users
def _like(text_value: str) -> str:
    """A case-insensitive 'contains' pattern with the user's own % and _ made literal."""
    escaped = text_value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


_SEARCH_TEXT = r"^[^\x00-\x1f\x7f]+$"  # any printable text, no control characters
_PHONE_FORMATTING_SQL = r"[\s\-()]"


async def _user_detail(db: AsyncSession, user: User) -> AdminUserDetail:
    count = await user_management.active_session_count(db, user.id)
    return AdminUserDetail(**AdminUserOut.model_validate(user).model_dump(),
                           suspended_at=user.suspended_at, suspension_reason=user.suspension_reason,
                           suspended_by_id=user.suspended_by_id, active_session_count=count,
                           payment_defaults=user.payment_defaults, bidding_blocked_until=user.bidding_blocked_until)


@router.get(
    "/users",
    response_model=Page[AdminUserOut],
    summary="Search users (newest first). All filters combine with AND.",
)
async def list_users(
    params: PaginationParams = Depends(pagination_params),
    q: Optional[str] = Query(None, min_length=1, max_length=100, pattern=_SEARCH_TEXT,
                             description="Matches part of the name, email or phone number"),
    name: Optional[str] = Query(None, min_length=1, max_length=100, pattern=_SEARCH_TEXT),
    email: Optional[str] = Query(None, min_length=1, max_length=255, pattern=_SEARCH_TEXT),
    phone: Optional[str] = Query(None, min_length=1, max_length=50, pattern=_SEARCH_TEXT),
    role: Optional[Literal["bidder", "seller", "admin"]] = None,
    kyc_status: Optional[Literal["pending", "verified", "rejected"]] = None,
    status: Optional[Literal["active", "suspended"]] = Query(None, description="Suspended = account switched off"),
    is_email_verified: Optional[bool] = None,
    is_mobile_verified: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User)

    def phone_clause(value: str):
        digits = "".join(ch for ch in value if ch.isdigit() or ch == "+")
        stored = func.regexp_replace(User.mobile, _PHONE_FORMATTING_SQL, "", "g")
        return stored.ilike(_like(digits), escape="\\") if digits else User.mobile.ilike(_like(value), escape="\\")

    if q:
        clauses = [User.name.ilike(_like(q), escape="\\"), User.email.ilike(_like(q), escape="\\"), phone_clause(q)]
        number = parse_buyer_id(q)
        if number is not None:
            clauses.append(User.buyer_number == number)        # Buyer ID: SLX-000123, slx123 or 123
        stmt = stmt.where(or_(*clauses))
    if name:
        stmt = stmt.where(User.name.ilike(_like(name), escape="\\"))
    if email:
        stmt = stmt.where(User.email.ilike(_like(email), escape="\\"))
    if phone:
        stmt = stmt.where(phone_clause(phone))
    if role:
        stmt = stmt.where(User.role == role)
    if kyc_status:
        stmt = stmt.where(User.kyc_status == kyc_status)
    if status:
        stmt = stmt.where(User.is_active.is_(status == "active"))
    if is_email_verified is not None:
        stmt = stmt.where(User.is_email_verified.is_(is_email_verified))
    if is_mobile_verified is not None:
        stmt = stmt.where(User.is_mobile_verified.is_(is_mobile_verified))
    stmt = stmt.order_by(User.created_at.desc(), User.id.desc())
    return await paginate(db, stmt, params, AdminUserOut)


@router.get("/users/{user_id}", response_model=AdminUserDetail, summary="One user, with suspension record")
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None:
        raise ApiError(404, "User not found.", "user_not_found")
    return await _user_detail(db, user)


@router.post("/users/{user_id}/suspend", response_model=AdminUserDetail,
             summary="Suspend an account (reason required); signs the user out everywhere at once")
async def suspend_user(user_id: uuid.UUID, body: SuspendUserRequest,
                       ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    user = await user_management.suspend_user(db, ctx.user, user_id, body.reason)
    detail = await _user_detail(db, user)
    await db.commit()  # the change, the session revocation and the audit entry are stored together
    return detail


@router.post("/users/{user_id}/reactivate", response_model=AdminUserDetail, summary="Lift a suspension")
async def reactivate_user(user_id: uuid.UUID, body: ReactivateUserRequest,
                          ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    user = await user_management.reactivate_user(db, ctx.user, user_id, body.reason)
    detail = await _user_detail(db, user)
    await db.commit()
    return detail


@router.post("/users/{user_id}/role", response_model=AdminUserDetail,
             summary="Change a user's role between bidder and seller (reason required; revokes sessions)")
async def change_user_role(user_id: uuid.UUID, body: ChangeRoleRequest,
                           ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    user = await user_management.change_role(db, ctx.user, user_id, body.role, body.reason)
    detail = await _user_detail(db, user)
    await db.commit()
    return detail


# ---------------------------------------------------------------------------- KYC review
@router.get(
    "/kyc/submissions",
    response_model=Page[AdminKycSubmissionRow],
    summary="KYC review queue (oldest submitted first)",
)
async def list_kyc_submissions(
    params: PaginationParams = Depends(pagination_params),
    status: Optional[Literal[SUBMISSION_STATUSES]] = Query(None, description="e.g. submitted = waiting for review"),
    user_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(KycSubmission).options(joinedload(KycSubmission.user))
    if status:
        stmt = stmt.where(KycSubmission.status == status)
    if user_id:
        stmt = stmt.where(KycSubmission.user_id == user_id)
    stmt = stmt.order_by(KycSubmission.submitted_at.asc().nulls_last(), KycSubmission.created_at.asc(), KycSubmission.id)
    return await paginate(db, stmt, params, AdminKycSubmissionRow)


@router.get("/kyc/submissions/{submission_id}", response_model=AdminKycSubmissionDetail,
            summary="One KYC submission with its documents and decision history")
async def get_kyc_submission(submission_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    submission = await kyc_service.load_submission(db, submission_id, with_user=True)
    if submission is None:
        raise ApiError(404, "KYC submission not found.", "kyc_not_found")
    return await _kyc_detail(db, submission)


async def _kyc_detail(db: AsyncSession, submission) -> AdminKycSubmissionDetail:
    other = False
    if submission.aadhaar_hash:
        other = (await db.execute(select(KycSubmission.id).where(
            KycSubmission.aadhaar_hash == submission.aadhaar_hash,
            KycSubmission.user_id != submission.user_id).limit(1))).first() is not None
    return AdminKycSubmissionDetail.model_validate(submission).model_copy(update={
        "aadhaar_masked": masked(submission.aadhaar_last4), "aadhaar_used_by_other_account": other})


@router.post("/kyc/submissions/{submission_id}/decision", response_model=AdminKycSubmissionDetail,
             summary="Approve, reject or request changes (reason required; recorded permanently)")
async def decide_kyc_submission(submission_id: uuid.UUID, body: KycDecisionRequest,
                                ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    await kyc_service.decide(db, ctx.user, submission_id, body.decision, body.reason)
    await db.commit()  # the decision, the status changes and the audit entry are stored together
    return await _kyc_detail(db, await kyc_service.load_submission(db, submission_id, with_user=True))


# ---------------------------------------------------------------------------- vehicle review
@router.get("/vehicles", response_model=Page[AdminVehicleRow], summary="Vehicles (oldest submitted first)")
async def list_vehicles(
    params: PaginationParams = Depends(pagination_params),
    status: Optional[Literal[VEHICLE_STATUSES]] = Query(None, description="e.g. submitted = waiting for review"),
    q: Optional[str] = Query(None, min_length=1, max_length=60, pattern=_SEARCH_TEXT,
                             description="Registration number, make or model"),
    owner_id: Optional[uuid.UUID] = None,
    listing_type: Optional[Literal["auction", "ready_to_lift"]] = None,
    ready_for_auction: bool = Query(False, description="Approved auction vehicles without an open (or sold) auction"),
    sold: Optional[bool] = Query(None, description="Ready to Lift: true = marked sold, false = still available"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Vehicle)
    if status:
        stmt = stmt.where(Vehicle.status == status)
    if listing_type:
        stmt = stmt.where(Vehicle.listing_type == listing_type)
    if sold is not None:
        stmt = stmt.where(Vehicle.sold_at.is_not(None) if sold else Vehicle.sold_at.is_(None))
    if ready_for_auction:
        released = select(Order.id).where(Order.auction_id == Auction.id, Order.status.in_(("defaulted", "cancelled")))
        locked = select(Auction.id).where(Auction.vehicle_id == Vehicle.id).where(
            Auction.status.in_(OPEN_AUCTION_STATUSES) | ((Auction.result == "sold") & ~released.exists()))
        stmt = stmt.where(Vehicle.status == "approved", Vehicle.listing_type == "auction", ~locked.exists())
    if owner_id:
        stmt = stmt.where(Vehicle.owner_id == owner_id)
    if q:
        compact = "".join(ch for ch in q.upper() if ch.isalnum())
        clauses = [Vehicle.make.ilike(_like(q), escape="\\"), Vehicle.model.ilike(_like(q), escape="\\")]
        if compact:
            clauses.append(Vehicle.registration_number.like(_like(compact), escape="\\"))
        stmt = stmt.where(or_(*clauses))
    stmt = stmt.options(selectinload(Vehicle.photos))
    stmt = stmt.order_by(Vehicle.submitted_at.asc().nulls_last(), Vehicle.created_at.asc(), Vehicle.id)
    return await paginate(db, stmt, params, AdminVehicleRow, transform=lambda v: AdminVehicleRow.model_validate(v).model_copy(
        update={"cover_photo_id": v.photos[0].id if v.photos else None}))


@router.get("/vehicles/{vehicle_id}", response_model=AdminVehicleOut, summary="One vehicle with all details")
async def get_vehicle_for_review(vehicle_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    vehicle = await vehicle_service.load_vehicle(db, vehicle_id)
    if vehicle is None:
        raise ApiError(404, "Vehicle not found.", "vehicle_not_found")
    locked = vehicle.status == "approved" and await auction_service.vehicle_locked_by_auction(db, vehicle.id)
    return AdminVehicleOut.model_validate(vehicle).model_copy(update={"locked": locked})


@router.post("/vehicles/{vehicle_id}/review", response_model=AdminVehicleOut,
             summary="Approve (publish), reject, or request changes (reason required unless approving)")
async def review_vehicle(vehicle_id: uuid.UUID, body: VehicleReviewRequest,
                         ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    await vehicle_service.review_vehicle(db, ctx.user, vehicle_id, body.decision, body.reason)
    await db.commit()
    return AdminVehicleOut.model_validate(await vehicle_service.load_vehicle(db, vehicle_id))


# ---------------------------------------------------------------------------- auctions
async def _auction_detail(db: AsyncSession, auction_id: uuid.UUID) -> AdminAuctionDetail:
    auction = (await db.execute(
        select(Auction).where(Auction.id == auction_id).options(selectinload(Auction.vehicle))
        .execution_options(populate_existing=True)
    )).scalar_one_or_none()
    if auction is None:
        raise ApiError(404, "Auction not found.", "auction_not_found")
    history = (await db.execute(
        select(AuditLog).where(AuditLog.target_type == "auction", AuditLog.target_id == str(auction_id))
        .order_by(AuditLog.created_at, AuditLog.id)
    )).scalars().all()
    base = AdminAuctionOut.build(auction, auction_service.now_utc())
    return AdminAuctionDetail(**base.model_dump(), history=[AuctionHistoryEntry.model_validate(h) for h in history])


@router.get("/auctions", response_model=Page[AdminAuctionOut], summary="All auctions (newest first)")
async def list_admin_auctions(
    params: PaginationParams = Depends(pagination_params),
    status: Optional[Literal[AUCTION_STATUSES]] = None,
    view: Optional[Literal["upcoming", "live", "ended"]] = Query(
        None, description="upcoming = not started; live = running or paused; ended = closed or cancelled"),
    vehicle_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    now = auction_service.now_utc()
    stmt = select(Auction).options(selectinload(Auction.vehicle).selectinload(Vehicle.photos))
    if status:
        stmt = stmt.where(Auction.status == status)
    if vehicle_id:
        stmt = stmt.where(Auction.vehicle_id == vehicle_id)
    if view == "upcoming":
        stmt = stmt.where(Auction.status == "scheduled", Auction.starts_at > now).order_by(Auction.starts_at, Auction.id)
    elif view == "live":
        stmt = stmt.where(or_(Auction.status == "paused", (Auction.status == "scheduled") & (Auction.starts_at <= now)))             .order_by(Auction.ends_at, Auction.id)
    elif view == "ended":
        stmt = stmt.where(Auction.status.in_(("closed", "cancelled")))             .order_by(Auction.closed_at.desc().nulls_last(), Auction.ends_at.desc(), Auction.id)
    else:
        stmt = stmt.order_by(Auction.created_at.desc(), Auction.id.desc())
    return await paginate(db, stmt, params, AdminAuctionOut, transform=lambda a: AdminAuctionOut.build(a, now))


@router.post("/auctions", response_model=AdminAuctionDetail, status_code=201,
             summary="Put an approved vehicle up for auction")
async def create_auction(body: AuctionCreate, ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    auction = await auction_service.create_auction(db, ctx.user, body.model_dump())
    await db.commit()
    return await _auction_detail(db, auction.id)


@router.get("/auctions/{auction_id}", response_model=AdminAuctionDetail, summary="One auction with its history")
async def get_admin_auction(auction_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await _auction_detail(db, auction_id)


@router.patch("/auctions/{auction_id}", response_model=AdminAuctionDetail,
              summary="Change price/times (before start) or the time-extension setting (any time)")
async def update_auction(auction_id: uuid.UUID, body: AuctionUpdate,
                         ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    changes = {name: getattr(body, name) for name in body.model_fields_set}
    await auction_service.update_auction(db, ctx.user, auction_id, changes)
    await db.commit()
    return await _auction_detail(db, auction_id)


@router.post("/auctions/{auction_id}/pause", response_model=AdminAuctionDetail, summary="Pause (reason required)")
async def pause_auction(auction_id: uuid.UUID, body: ReasonRequest,
                        ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    await auction_service.pause_auction(db, ctx.user, auction_id, body.reason)
    await db.commit()
    return await _auction_detail(db, auction_id)


@router.post("/auctions/{auction_id}/resume", response_model=AdminAuctionDetail,
             summary="Resume; the end time moves forward by the paused time")
async def resume_auction(auction_id: uuid.UUID, body: OptionalReasonRequest,
                         ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    await auction_service.resume_auction(db, ctx.user, auction_id, body.reason)
    await db.commit()
    return await _auction_detail(db, auction_id)


@router.post("/auctions/{auction_id}/extend", response_model=AdminAuctionDetail, summary="Extend the end time")
async def extend_auction(auction_id: uuid.UUID, body: ExtendRequest,
                         ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    await auction_service.extend_auction(db, ctx.user, auction_id, body.minutes, body.reason)
    await db.commit()
    return await _auction_detail(db, auction_id)


@router.post("/auctions/{auction_id}/cancel", response_model=AdminAuctionDetail, summary="Cancel (reason required)")
async def cancel_auction(auction_id: uuid.UUID, body: ReasonRequest,
                         ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    await auction_service.cancel_auction(db, ctx.user, auction_id, body.reason)
    await db.commit()
    return await _auction_detail(db, auction_id)


@router.post("/auctions/{auction_id}/close", response_model=AdminAuctionDetail,
             summary="Close now and decide the result (sold to the highest bidder, or no sale)")
async def close_auction(auction_id: uuid.UUID, body: ReasonRequest,
                        ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    await auction_service.close_auction(db, ctx.user, auction_id, body.reason)
    await db.commit()
    return await _auction_detail(db, auction_id)


@router.get("/auctions/{auction_id}/bids", response_model=Page[AdminBid], summary="All bids with bidder ids, newest first")
async def admin_bid_history(auction_id: uuid.UUID, params: PaginationParams = Depends(pagination_params),
                            db: AsyncSession = Depends(get_db)):
    if (await db.execute(select(Auction.id).where(Auction.id == auction_id))).first() is None:
        raise ApiError(404, "Auction not found.", "auction_not_found")
    stmt = (select(AuctionBid, User.name, User.email).join(User, User.id == AuctionBid.bidder_id)
            .where(AuctionBid.auction_id == auction_id)
            .order_by(AuctionBid.created_at.desc(), AuctionBid.amount.desc()))
    total = (await db.execute(select(func.count()).select_from(AuctionBid).where(AuctionBid.auction_id == auction_id))).scalar_one()
    rows = (await db.execute(stmt.limit(params.page_size).offset(params.offset))).all()
    return Page[AdminBid](
        items=[AdminBid(id=b.id, bidder_id=b.bidder_id, bidder_name=name, bidder_email=email,
                        amount=b.amount, rc_option=b.rc_option, created_at=b.created_at) for b, name, email in rows],
        page=params.page, page_size=params.page_size, total=total,
        pages=(total + params.page_size - 1) // params.page_size)


# ---------------------------------------------------------------------------- dashboard
@router.get("/dashboard", response_model=AdminDashboard, summary="Counts for the admin home screen")
async def admin_dashboard(db: AsyncSession = Depends(get_db)):
    now = auction_service.now_utc()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)

    async def count(stmt) -> int:
        return (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()

    return AdminDashboard(
        users_total=await count(select(User.id)),
        bidders=await count(select(User.id).where(User.role == "bidder")),
        sellers=await count(select(User.id).where(User.role == "seller")),
        suspended_users=await count(select(User.id).where(User.is_active.is_(False))),
        kyc_waiting_review=await count(select(KycSubmission.id).where(KycSubmission.status == "submitted")),
        vehicles_waiting_review=await count(select(Vehicle.id).where(Vehicle.status == "submitted")),
        vehicles_approved=await count(select(Vehicle.id).where(Vehicle.status == "approved")),
        auctions_live=await count(select(Auction.id).where(
            Auction.status == "scheduled", Auction.starts_at <= now, Auction.ends_at > now)),
        auctions_upcoming=await count(select(Auction.id).where(Auction.status == "scheduled", Auction.starts_at > now)),
        auctions_paused=await count(select(Auction.id).where(Auction.status == "paused")),
        auctions_awaiting_close=await count(select(Auction.id).where(Auction.status == "scheduled", Auction.ends_at <= now)),
        bids_today=await count(select(AuctionBid.id).where(AuctionBid.created_at >= start_of_day)),
        orders_awaiting_payment=await count(select(Order.id).where(Order.status == "awaiting_payment")),
        payments_to_confirm=await count(select(Order.id).where(Order.status == "payment_submitted")),
        part_requests_new=await count(select(PartRequest.id).where(PartRequest.status == "new")),
        contact_messages_new=await count(select(ContactMessage.id).where(ContactMessage.status == "new")),
        deals_fee_pending=await count(
            select(Order.id).outerjoin(FeePayment, FeePayment.order_id == Order.id).where(Order.status != "cancelled")
            .group_by(Order.id, Order.service_fee)
            .having(or_(Order.service_fee.is_(None), func.coalesce(func.sum(FeePayment.amount), 0) < Order.service_fee))),
        online_payment=settings.ONLINE_PAYMENT_FLOW,
        enquiries_new=await count(select(VehicleEnquiry.id).where(VehicleEnquiry.status == "new")),
        ready_to_lift_available=await count(select(Vehicle.id).where(
            Vehicle.status == "approved", Vehicle.listing_type == "ready_to_lift", Vehicle.sold_at.is_(None))),
        server_time=now,
    )


# ---------------------------------------------------------------------------- orders & payments
def _admin_order(order, now):
    buyer = order.buyer
    return AdminOrderOut.build(order, order_service.bank_details(), now, buyer_id=buyer.id, buyer_name=buyer.name,
                               buyer_email=buyer.email, buyer_mobile=buyer.mobile, confirmed_by_id=order.confirmed_by_id)


@router.get("/orders", response_model=Page[AdminOrderOut], summary="Orders of won auctions (payment follow-up)")
async def list_orders(
    params: PaginationParams = Depends(pagination_params),
    status: Optional[Literal[ORDER_STATUSES]] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Order).options(selectinload(Order.vehicle), selectinload(Order.buyer))
    if status:
        stmt = stmt.where(Order.status == status)
    stmt = stmt.order_by(Order.created_at.desc(), Order.id)
    now = order_service.now_utc()
    return await paginate(db, stmt, params, AdminOrderOut, transform=lambda o: _admin_order(o, now))


@router.get("/orders/{order_id}", response_model=AdminOrderOut, summary="One order")
async def get_admin_order(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    order = await load_order(db, order_id)
    if order is None:
        raise ApiError(404, "Order not found.", "order_not_found")
    return _admin_order(order, order_service.now_utc())


@router.post("/orders/{order_id}/confirm-payment", response_model=AdminOrderOut,
             summary="The bank statement shows the money: mark the order paid")
async def confirm_order_payment(order_id: uuid.UUID, ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    await order_service.confirm_payment(db, ctx.user, order_id)
    await db.commit()
    return _admin_order(await load_order(db, order_id), order_service.now_utc())


@router.post("/orders/{order_id}/reject-payment", response_model=AdminOrderOut,
             summary="The UTR could not be matched: send it back to the buyer (reason required)")
async def reject_order_payment(order_id: uuid.UUID, body: OrderReasonRequest,
                               ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    await order_service.reject_payment(db, ctx.user, order_id, body.reason)
    await db.commit()
    return _admin_order(await load_order(db, order_id), order_service.now_utc())


@router.post("/orders/{order_id}/complete", response_model=DealOut,
             summary="Mark the deal completed (no online payment: the buyer and the owner finished it)")
async def complete_admin_deal(order_id: uuid.UUID, body: OptionalReasonRequest,
                              ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    order = await order_service.complete_deal(db, ctx.user, order_id, body.reason)
    await db.commit()
    return DealOut(**await deal_service.deal_view(db, order))


@router.post("/orders/{order_id}/cancel", response_model=AdminOrderOut, summary="Cancel an unpaid order (no penalty)")
async def cancel_admin_order(order_id: uuid.UUID, body: OrderReasonRequest,
                             ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    await order_service.cancel_order(db, ctx.user, order_id, body.reason)
    await db.commit()
    return _admin_order(await load_order(db, order_id), order_service.now_utc())


@router.post("/users/{user_id}/unblock-bidding", response_model=AdminUserDetail,
             summary="Lift a bidding block caused by an unpaid win (reason required)")
async def unblock_bidding(user_id: uuid.UUID, body: OrderReasonRequest,
                          ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    user = await order_service.lift_bidding_block(db, ctx.user, user_id, body.reason)
    detail = await _user_detail(db, user)
    await db.commit()
    return detail


# ---------------------------------------------------------------------------- spare parts & part requests


@router.get("/parts", response_model=Page[PartOut], summary="All spare parts (including hidden ones)")
async def admin_list_parts(params: PaginationParams = Depends(pagination_params),
                           q: Optional[str] = Query(None, min_length=1, max_length=80, pattern=_SEARCH_TEXT),
                           db: AsyncSession = Depends(get_db)):
    stmt = select(SparePart)
    if q:
        stmt = stmt.where(or_(SparePart.name.ilike(_like(q), escape="\\"), SparePart.make.ilike(_like(q), escape="\\"),
                              SparePart.model.ilike(_like(q), escape="\\")))
    stmt = stmt.order_by(SparePart.created_at.desc(), SparePart.id)
    return await paginate(db, stmt, params, PartOut, transform=PartOut.build)


@router.post("/parts", response_model=PartOut, status_code=201, summary="Add a spare part")
async def admin_create_part(body: PartWrite, ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    part = SparePart(**body.model_dump())
    db.add(part)
    await db.flush()
    await record_audit(db, actor=ctx.user, action="part.create", target_type="spare_part", target_id=part.id,
                       details={"name": part.name, "price": str(part.price), "stock": part.stock})
    await db.commit()
    return PartOut.build(part)


@router.put("/parts/{part_id}", response_model=PartOut, summary="Edit a spare part (full details)")
async def admin_update_part(part_id: uuid.UUID, body: PartWrite, ctx: AuthContext = Depends(require_csrf),
                            db: AsyncSession = Depends(get_db)):
    part = (await db.execute(select(SparePart).where(SparePart.id == part_id).with_for_update())).scalar_one_or_none()
    if part is None:
        raise ApiError(404, "Part not found.", "part_not_found")
    changed = {}
    for name, value in body.model_dump().items():
        if getattr(part, name) != value:
            changed[name] = value if isinstance(value, (bool, int, type(None))) else str(value)
            setattr(part, name, value)
    if changed:
        await db.flush()
        await record_audit(db, actor=ctx.user, action="part.update", target_type="spare_part", target_id=part.id,
                           details={"changes": changed})
    await db.commit()
    return PartOut.build(part)


@router.post("/parts/{part_id}/photo", response_model=PartOut, summary="Set the part photo (JPEG or PNG, raw body)",
             openapi_extra={"requestBody": {"required": True, "content": {
                 t: {"schema": {"type": "string", "format": "binary"}} for t in ("image/jpeg", "image/png")}}})
async def admin_part_photo(part_id: uuid.UUID, request: Request, ctx: AuthContext = Depends(require_csrf),
                           db: AsyncSession = Depends(get_db), storage: PrivateStorage = Depends(get_private_storage)):
    data = await read_body_capped(request, settings.VEHICLE_MAX_PHOTO_BYTES)
    content_type = validate_upload(data, request.headers.get("content-type"), settings.VEHICLE_MAX_PHOTO_BYTES,
                                   allowed=(JPEG, PNG))
    part = (await db.execute(select(SparePart).where(SparePart.id == part_id).with_for_update())).scalar_one_or_none()
    if part is None:
        raise ApiError(404, "Part not found.", "part_not_found")
    old_key = part.photo_key
    data = strip_metadata(data, content_type)          # no GPS location / phone details on the website
    key = storage.save(data, area="parts")
    try:
        part.photo_key, part.photo_type = key, content_type
        await record_audit(db, actor=ctx.user, action="part.photo", target_type="spare_part", target_id=part.id,
                           details={"size_bytes": len(data), "content_type": content_type})
        await db.commit()
    except BaseException:
        storage.delete(key)
        raise
    if old_key:
        storage.delete(old_key)                     # only after the new photo is saved
    return PartOut.build(part)


def _part_enquiry(r: PartRequest, user: User) -> AdminPartRequestOut:
    return AdminPartRequestOut(**PartRequestOut.model_validate(r).model_dump(), admin_note=r.admin_note,
                               buyer_id=user.buyer_id or "", user_id=r.user_id, user_name=user.name,
                               user_email=user.email, user_mobile=user.mobile or "")


@router.get("/part-requests", response_model=Page[AdminPartRequestOut], summary="Spare part enquiries")
async def admin_list_part_requests(params: PaginationParams = Depends(pagination_params),
                                   status: Optional[Literal[REQUEST_STATUSES]] = None,
                                   q: Optional[str] = Query(None, min_length=1, max_length=60, pattern=_SEARCH_TEXT,
                                                            description="Customer, Buyer ID, phone, part or vehicle"),
                                   db: AsyncSession = Depends(get_db)):
    stmt = select(PartRequest, User).join(User, User.id == PartRequest.user_id)
    if status:
        stmt = stmt.where(PartRequest.status == status)
    if q:
        clauses = [col.ilike(_like(q), escape="\\") for col in (
            User.name, User.email, PartRequest.contact_phone, PartRequest.part_name, PartRequest.vehicle_make,
            PartRequest.vehicle_model, PartRequest.number)]
        number = parse_buyer_id(q)
        if number is not None:
            clauses.append(User.buyer_number == number)
        stmt = stmt.where(or_(*clauses))
    total = await parts_count(db, stmt.with_only_columns(PartRequest.id))
    rows = (await db.execute(stmt.order_by(PartRequest.created_at.desc(), PartRequest.id)
                             .limit(params.page_size).offset(params.offset))).all()
    return parts_page([_part_enquiry(r, u) for r, u in rows], params, total, AdminPartRequestOut)


@router.get("/part-requests/{request_id}", response_model=AdminPartRequestOut, summary="One part request")
async def admin_get_part_request(request_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    row = (await db.execute(select(PartRequest, User).join(User, User.id == PartRequest.user_id)
                            .where(PartRequest.id == request_id))).first()
    if row is None:
        raise ApiError(404, "Request not found.", "part_request_not_found")
    return _part_enquiry(*row)


@router.post("/part-requests/{request_id}/update", response_model=AdminPartRequestOut,
             summary="Mark contacted / closed and keep an internal note (nothing is sent to the customer)")
async def admin_update_part_request(request_id: uuid.UUID, body: PartRequestUpdate,
                                    ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    item = (await db.execute(select(PartRequest).where(PartRequest.id == request_id).with_for_update())).scalar_one_or_none()
    if item is None:
        raise ApiError(404, "Request not found.", "part_request_not_found")
    changes = {name: getattr(body, name) for name in body.model_fields_set}
    for name, value in changes.items():
        setattr(item, name, value)
    await db.flush()
    details = {k: (None if v is None else str(v)) for k, v in changes.items()}
    details["number"] = item.number
    await record_audit(db, actor=ctx.user, action="part_request.update", target_type="part_request", target_id=item.id,
                       details=details)
    await db.commit()
    user = (await db.execute(select(User).where(User.id == item.user_id))).scalar_one()
    return _part_enquiry(item, user)


# ---------------------------------------------------------------------------- contact messages
@router.get("/contact-messages", response_model=Page[AdminContactOut], summary="Messages from the Contact page")
async def admin_list_contact_messages(params: PaginationParams = Depends(pagination_params),
                                      status: Optional[Literal[CONTACT_STATUSES]] = None,
                                      db: AsyncSession = Depends(get_db)):
    stmt = select(ContactMessage)
    if status:
        stmt = stmt.where(ContactMessage.status == status)
    stmt = stmt.order_by(ContactMessage.created_at.desc(), ContactMessage.id)
    return await paginate(db, stmt, params, AdminContactOut)


@router.get("/contact-messages/{message_id}", response_model=AdminContactOut, summary="One contact message")
async def admin_get_contact_message(message_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    item = (await db.execute(select(ContactMessage).where(ContactMessage.id == message_id))).scalar_one_or_none()
    if item is None:
        raise ApiError(404, "Message not found.", "contact_message_not_found")
    return AdminContactOut.model_validate(item)


@router.post("/contact-messages/{message_id}/update", response_model=AdminContactOut,
             summary="Change the status of a contact message or add an internal note")
async def admin_update_contact_message(message_id: uuid.UUID, body: ContactUpdate,
                                       ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    item = (await db.execute(select(ContactMessage).where(ContactMessage.id == message_id).with_for_update())).scalar_one_or_none()
    if item is None:
        raise ApiError(404, "Message not found.", "contact_message_not_found")
    changes = {name: getattr(body, name) for name in body.model_fields_set}
    for name, value in changes.items():
        setattr(item, name, value)
    await db.flush()
    await record_audit(db, actor=ctx.user, action="contact_message.update", target_type="contact_message",
                       target_id=item.id, details={"number": item.number, **changes})
    await db.commit()
    return AdminContactOut.model_validate(item)


# ---------------------------------------------------------------------------- results (who won)
async def _fee_sums(db: AsyncSession, order_ids) -> dict:
    if not order_ids:
        return {}
    rows = (await db.execute(select(FeePayment.order_id, func.sum(FeePayment.amount))
                             .where(FeePayment.order_id.in_(order_ids)).group_by(FeePayment.order_id))).all()
    return {oid: Decimal(total).quantize(Decimal("0.01")) for oid, total in rows}


async def _cover_photos(db: AsyncSession, vehicle_ids) -> dict:
    """First photo of each vehicle (for thumbnails)."""
    if not vehicle_ids:
        return {}
    rows = (await db.execute(select(VehiclePhoto.vehicle_id, VehiclePhoto.id).where(VehiclePhoto.vehicle_id.in_(vehicle_ids))
                             .order_by(VehiclePhoto.position, VehiclePhoto.uploaded_at, VehiclePhoto.id))).all()   # the cover first
    covers = {}
    for vid, pid in rows:
        covers.setdefault(vid, pid)
    return covers


def _result_query():
    return (select(Auction, Vehicle, User, Order)
            .join(Vehicle, Vehicle.id == Auction.vehicle_id)
            .outerjoin(User, User.id == Auction.current_winner_id)
            .outerjoin(Order, Order.auction_id == Auction.id)
            .where(Auction.status == "closed"))


def _result_row(auction, vehicle, winner, order, schema=AdminResultRow, **extra):
    title = f"{vehicle.manufacturing_year} {vehicle.make} {vehicle.model} {vehicle.variant}"
    return schema(
        auction_id=auction.id, vehicle_id=vehicle.id, vehicle_title=title, registration_number=vehicle.registration_number,
        category=vehicle.category, result=auction.result, starting_price=auction.starting_price,
        winning_amount=auction.current_price if auction.result == "sold" else None, bid_count=auction.bid_count,
        # The Without RC ladder is reported whatever the result: the company quotes the insurer both.
        starting_price_without_rc=auction.starting_price_without_rc,
        highest_without_rc=auction.current_price_without_rc, bid_count_without_rc=auction.bid_count_without_rc,
        closed_at=auction.closed_at,
        winner_id=winner.id if winner else None, winner_name=winner.name if winner else None,
        winner_email=winner.email if winner else None, winner_mobile=winner.mobile if winner else None,
        winner_buyer_id=format_buyer_id(winner.buyer_number) if winner else None,
        order_id=order.id if order else None, order_number=order.number if order else None,
        order_status=order.status if order else None, **extra)


@router.get("/results", response_model=Page[AdminResultRow], summary="Finished auctions with the winner and amount")
async def admin_results(params: PaginationParams = Depends(pagination_params),
                        result: Optional[Literal["sold", "no_sale"]] = None,
                        q: Optional[str] = Query(None, min_length=1, max_length=80, pattern=r"^[^\x00-\x1f\x7f<>]+$",
                                                 description="Vehicle, registration or winner"),
                        db: AsyncSession = Depends(get_db)):
    stmt = _result_query()
    if result:
        stmt = stmt.where(Auction.result == result)
    if q:
        like = "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
        clauses = [col.ilike(like, escape="\\") for col in (
            Vehicle.make, Vehicle.model, Vehicle.registration_number, Vehicle.claim_number, User.name, User.email)]
        number = parse_buyer_id(q)
        if number is not None:
            clauses.append(User.buyer_number == number)
        stmt = stmt.where(or_(*clauses))
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (await db.execute(stmt.order_by(Auction.closed_at.desc().nulls_last(), Auction.id)
                             .limit(params.page_size).offset(params.offset))).all()
    covers = await _cover_photos(db, [r[1].id for r in rows])
    fees = await _fee_sums(db, [r[3].id for r in rows if r[3] is not None])
    items = []
    for r in rows:
        order = r[3]
        received = fees.get(order.id, Decimal("0.00")) if order else None
        items.append(_result_row(*r, cover_photo_id=covers.get(r[1].id),
                                 approved_amount=order.approved_amount if order else None,
                                 service_fee=order.service_fee if order else None, fee_received=received,
                                 fee_pending=(order.service_fee - received) if order and order.service_fee is not None else None))
    return Page[AdminResultRow](items=items,
                                page=params.page, page_size=params.page_size,
                                total=total, pages=(total + params.page_size - 1) // params.page_size)


@router.get("/results/{auction_id}", response_model=AdminResultDetail, summary="One result: winner details, amount, payment, top bids")
async def admin_result(auction_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    row = (await db.execute(_result_query().where(Auction.id == auction_id))).first()
    if row is None:
        raise ApiError(404, "No finished auction with this id.", "result_not_found")
    auction, vehicle, winner, order = row
    bids = (await db.execute(
        select(AuctionBid, User.name, User.email).join(User, User.id == AuctionBid.bidder_id)
        .where(AuctionBid.auction_id == auction_id).order_by(AuctionBid.amount.desc()).limit(5))).all()
    covers = await _cover_photos(db, [vehicle.id])
    deal = await deal_service.deal_view(db, order) if order else None
    return _result_row(
        auction, vehicle, winner, order, schema=AdminResultDetail, cover_photo_id=covers.get(vehicle.id),
        claim_number=vehicle.claim_number, deal=DealOut(**deal).model_dump(mode="json") if deal else None,
        approved_amount=order.approved_amount if order else None, service_fee=order.service_fee if order else None,
        fee_received=deal["fee_received"] if deal else None, fee_pending=deal["fee_pending"] if deal else None,
        location=vehicle.location, starts_at=auction.starts_at, ends_at=auction.ends_at,
        winner_organization=winner.organization if winner else None,
        winner_kyc_status=winner.kyc_status if winner else None,
        winner_since=winner.created_at if winner else None,
        winner_is_active=winner.is_active if winner else None,
        order_due_at=order.due_at if order else None, order_utr=order.utr if order else None,
        order_payment_submitted_at=order.payment_submitted_at if order else None,
        order_paid_at=order.paid_at if order else None,
        top_bids=[AdminResultBid(bidder_name=name, bidder_email=email, amount=b.amount, created_at=b.created_at)
                  for b, name, email in bids])


# ---------------------------------------------------------------------------- deal & service fee (manual)
async def _deal_out(db: AsyncSession, order_id: uuid.UUID) -> DealOut:
    order = (await db.execute(select(Order).where(Order.id == order_id).execution_options(populate_existing=True))).scalar_one_or_none()
    if order is None:
        raise ApiError(404, "Order not found.", "order_not_found")
    return DealOut(**await deal_service.deal_view(db, order))


@router.get("/orders/{order_id}/deal", response_model=DealOut, summary="The deal: approved amount, service fee, fee received")
async def admin_get_deal(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await _deal_out(db, order_id)


@router.patch("/orders/{order_id}/deal", response_model=DealOut,
              summary="Set the approved amount, approved date or service fee (audit-logged)")
async def admin_update_deal(order_id: uuid.UUID, body: DealUpdate, ctx: AuthContext = Depends(require_csrf),
                            db: AsyncSession = Depends(get_db)):
    changes = {name: getattr(body, name) for name in body.model_fields_set}
    await deal_service.update_deal(db, ctx.user, order_id, changes)
    await db.commit()
    return await _deal_out(db, order_id)


@router.post("/orders/{order_id}/fees", response_model=DealOut, status_code=201,
             summary="Record service fee received outside the website (append-only; minus = correction)")
async def admin_add_fee(order_id: uuid.UUID, body: FeePaymentCreate, ctx: AuthContext = Depends(require_csrf),
                        db: AsyncSession = Depends(get_db)):
    await deal_service.add_fee_payment(db, ctx.user, order_id, body.amount, body.received_on, body.reference, body.note)
    await db.commit()
    return await _deal_out(db, order_id)


# ---------------------------------------------------------------------------- monthly report
@router.get("/reports/monthly", response_model=MonthlyReport, summary="Monthly report (month = 2026-10; default last month)")
async def admin_monthly_report(month: Optional[str] = Query(None, max_length=7), db: AsyncSession = Depends(get_db)):
    year, mon = report_service.parse_month(month)
    return MonthlyReport(**await report_service.monthly_report(db, year, mon))


@router.get("/reports/monthly/export", summary="Monthly report as a CSV file that opens in Excel",
            response_class=Response, responses={200: {"content": {"text/csv": {}}}})
async def admin_monthly_report_csv(month: Optional[str] = Query(None, max_length=7),
                                   section: Literal["payments", "vehicles", "buyers"] = Query("payments"),
                                   db: AsyncSession = Depends(get_db)):
    year, mon = report_service.parse_month(month)
    report = await report_service.monthly_report(db, year, mon)
    data = report_service.to_csv(report, section)
    name = f"salvex-{section}-{year:04d}-{mon:02d}.csv"
    return Response(content=data, media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{name}"', "Cache-Control": "no-store"})


# ---------------------------------------------------------------------------- Ready to Lift: sold / reopen, enquiries
async def _lock_ready_to_lift(db: AsyncSession, vehicle_id: uuid.UUID) -> Vehicle:
    vehicle = (await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id).with_for_update()
                                .execution_options(populate_existing=True))).scalar_one_or_none()
    if vehicle is None:
        raise ApiError(404, "Vehicle not found.", "vehicle_not_found")
    if vehicle.listing_type != "ready_to_lift" or vehicle.status != "approved":
        raise ApiError(409, "Only a published Ready to Lift vehicle can be marked sold or reopened.", "not_ready_to_lift")
    return vehicle


@router.post("/vehicles/{vehicle_id}/mark-sold", response_model=AdminVehicleOut,
             summary="Ready to Lift vehicle sold: it leaves the public list (reason kept on record)")
async def mark_ready_to_lift_sold(vehicle_id: uuid.UUID, body: OptionalReasonRequest,
                                  ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    vehicle = await _lock_ready_to_lift(db, vehicle_id)
    if vehicle.sold_at is not None:
        raise ApiError(409, "This vehicle is already marked sold.", "already_sold")
    vehicle.sold_at = auction_service.now_utc()
    await record_audit(db, actor=ctx.user, action="vehicle.ready_to_lift_sold", target_type="vehicle",
                       target_id=vehicle.id, details={"reason": body.reason})
    await db.commit()
    return AdminVehicleOut.model_validate(await vehicle_service.load_vehicle(db, vehicle.id))


@router.post("/vehicles/{vehicle_id}/reopen", response_model=AdminVehicleOut,
             summary="Show a Ready to Lift vehicle again (e.g. the sale fell through)")
async def reopen_ready_to_lift(vehicle_id: uuid.UUID, body: OptionalReasonRequest,
                               ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    vehicle = await _lock_ready_to_lift(db, vehicle_id)
    if vehicle.sold_at is None:
        raise ApiError(409, "This vehicle is not marked sold.", "not_sold")
    vehicle.sold_at = None
    await record_audit(db, actor=ctx.user, action="vehicle.ready_to_lift_reopened", target_type="vehicle",
                       target_id=vehicle.id, details={"reason": body.reason})
    await db.commit()
    return AdminVehicleOut.model_validate(await vehicle_service.load_vehicle(db, vehicle.id))


def _enquiry_query():
    return (select(VehicleEnquiry, Vehicle, User).join(Vehicle, Vehicle.id == VehicleEnquiry.vehicle_id)
            .join(User, User.id == VehicleEnquiry.user_id))


def _enquiry_out(enquiry, vehicle, user, cover=None) -> AdminEnquiryOut:
    return AdminEnquiryOut(
        id=enquiry.id, number=enquiry.number, vehicle_id=vehicle.id, status=enquiry.status, created_at=enquiry.created_at,
        admin_note=enquiry.admin_note, updated_at=enquiry.updated_at,
        vehicle_title=f"{vehicle.manufacturing_year} {vehicle.make} {vehicle.model} {vehicle.variant}",
        registration_number=vehicle.registration_number, claim_number=vehicle.claim_number, location=vehicle.location,
        vehicle_sold=vehicle.sold_at is not None, cover_photo_id=cover, buyer_id=format_buyer_id(user.buyer_number),
        buyer_user_id=user.id, buyer_name=user.name, buyer_email=user.email, buyer_mobile=user.mobile,
        buyer_kyc_status=user.kyc_status)


@router.get("/enquiries", response_model=Page[AdminEnquiryOut], summary="Ready to Lift 'I'm interested' requests")
async def admin_list_enquiries(params: PaginationParams = Depends(pagination_params),
                               status: Optional[Literal[ENQUIRY_STATUSES]] = None,
                               q: Optional[str] = Query(None, min_length=1, max_length=80, pattern=_SEARCH_TEXT,
                                                        description="Buyer, Buyer ID, phone or vehicle"),
                               db: AsyncSession = Depends(get_db)):
    stmt = _enquiry_query()
    if status:
        stmt = stmt.where(VehicleEnquiry.status == status)
    if q:
        clauses = [col.ilike(_like(q), escape="\\") for col in (User.name, User.email, User.mobile, Vehicle.make,
                                                                  Vehicle.model, Vehicle.registration_number)]
        number = parse_buyer_id(q)
        if number is not None:
            clauses.append(User.buyer_number == number)
        stmt = stmt.where(or_(*clauses))
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (await db.execute(stmt.order_by(VehicleEnquiry.created_at.desc(), VehicleEnquiry.id)
                             .limit(params.page_size).offset(params.offset))).all()
    covers = await _cover_photos(db, [r[1].id for r in rows])
    return Page[AdminEnquiryOut](items=[_enquiry_out(*r, cover=covers.get(r[1].id)) for r in rows], page=params.page,
                                 page_size=params.page_size, total=total,
                                 pages=(total + params.page_size - 1) // params.page_size)


@router.get("/enquiries/{enquiry_id}", response_model=AdminEnquiryOut, summary="One enquiry")
async def admin_get_enquiry(enquiry_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    row = (await db.execute(_enquiry_query().where(VehicleEnquiry.id == enquiry_id))).first()
    if row is None:
        raise ApiError(404, "Enquiry not found.", "enquiry_not_found")
    covers = await _cover_photos(db, [row[1].id])
    return _enquiry_out(*row, cover=covers.get(row[1].id))


@router.post("/enquiries/{enquiry_id}/update", response_model=AdminEnquiryOut,
             summary="Mark an enquiry contacted / closed or add a note (audit-logged)")
async def admin_update_enquiry(enquiry_id: uuid.UUID, body: EnquiryUpdate, ctx: AuthContext = Depends(require_csrf),
                               db: AsyncSession = Depends(get_db)):
    enquiry = (await db.execute(select(VehicleEnquiry).where(VehicleEnquiry.id == enquiry_id).with_for_update())).scalar_one_or_none()
    if enquiry is None:
        raise ApiError(404, "Enquiry not found.", "enquiry_not_found")
    changes = {name: getattr(body, name) for name in body.model_fields_set}
    for name, value in changes.items():
        setattr(enquiry, name, value)
    await db.flush()
    await record_audit(db, actor=ctx.user, action="enquiry.update", target_type="vehicle_enquiry", target_id=enquiry.id,
                       details={"number": enquiry.number, **changes})
    await db.commit()
    return await admin_get_enquiry(enquiry_id, db)
