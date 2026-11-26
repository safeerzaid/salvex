"""
Auction request/response shapes. Money is Decimal (sent and returned as text, e.g. "50000.00") so no
rounding errors can creep in; times must carry a timezone. Every public response includes the server's
current time so screens can count down against the server clock, not the visitor's computer clock.
"""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated, List, Optional

from sqlalchemy import inspect as sa_inspect
from pydantic import AfterValidator, AwareDatetime, BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.vehicles import CatalogueVehicle

# Always exactly two decimal places, so "50000" and "50000.00" are the same amount everywhere.
Money = Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=2, allow_inf_nan=False),
                  AfterValidator(lambda v: v.quantize(Decimal("0.01")))]


def _clean_reason(value: Optional[str], required: bool) -> Optional[str]:
    clean = " ".join((value or "").split())
    if required and len(clean) < 3:
        raise ValueError("A reason of at least 3 characters is required.")
    if any(ord(ch) < 32 or ord(ch) == 127 for ch in clean):
        raise ValueError("The reason contains invalid characters.")
    return clean or None


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class AuctionCreate(_Strict):
    vehicle_id: uuid.UUID
    starting_price: Money                                 # expected amount for the With RC ladder
    # Expected amount for the Without RC ladder. Optional: left out, that ladder has no minimum and any
    # first bid is accepted. The two are normally far apart (e.g. 1,00,000 with RC, 40,000 without).
    starting_price_without_rc: Optional[Money] = None
    starts_at: AwareDatetime
    ends_at: AwareDatetime
    extension_enabled: bool = False
    extension_minutes: Optional[int] = Field(None, ge=1, le=60, description="Defaults to the configured value")

    @model_validator(mode="after")
    def _order(self):
        if self.ends_at <= self.starts_at:
            raise ValueError("The end time must be after the start time.")
        return self


class AuctionUpdate(_Strict):
    """Price and times only before the auction starts (and before any bid); extension settings any time."""
    starting_price: Optional[Money] = None
    starting_price_without_rc: Optional[Money] = None
    starts_at: Optional[AwareDatetime] = None
    ends_at: Optional[AwareDatetime] = None
    extension_enabled: Optional[bool] = None
    extension_minutes: Optional[int] = Field(None, ge=1, le=60)

    @model_validator(mode="after")
    def _non_empty(self):
        if not self.model_fields_set:
            raise ValueError("Send at least one field to change.")
        if any(getattr(self, name) is None for name in self.model_fields_set):
            raise ValueError("Fields cannot be set to empty.")
        return self


class ReasonRequest(_Strict):
    reason: str = Field(..., max_length=500)

    @field_validator("reason")
    @classmethod
    def _reason(cls, v: str) -> str:
        return _clean_reason(v, required=True)


class OptionalReasonRequest(_Strict):
    reason: Optional[str] = Field(None, max_length=500)

    @field_validator("reason")
    @classmethod
    def _reason(cls, v: Optional[str]) -> Optional[str]:
        return _clean_reason(v, required=False)


class ExtendRequest(ReasonRequest):
    minutes: int = Field(..., ge=1, le=7 * 24 * 60)


class AuctionPublic(BaseModel):
    """What everyone sees. Who is winning is not shown here (bid history, masked, comes in Module 6).

    The starting price is NOT part of this view. The client asked on 2026-11-26 that it stay hidden from
    bidders and be visible to admins only, so it is served by the admin endpoints alone - never here, and
    never in a bid refusal message. Before the first bid `current_price` is None and the page says only
    that bidding is open."""
    id: uuid.UUID
    phase: str
    result: Optional[str]
    current_price: Optional[Decimal]                 # the With RC ladder
    bid_count: int
    current_price_without_rc: Optional[Decimal]      # the Without RC ladder; both run on every auction
    bid_count_without_rc: int
    starts_at: datetime
    ends_at: datetime
    extension_enabled: bool
    extension_minutes: int
    server_time: datetime
    vehicle: CatalogueVehicle

    @classmethod
    def build(cls, auction, now: datetime) -> "AuctionPublic":
        return cls(
            id=auction.id, phase=auction.phase(now), result=auction.result,
            current_price=auction.current_price, bid_count=auction.bid_count,
            current_price_without_rc=auction.current_price_without_rc,
            bid_count_without_rc=auction.bid_count_without_rc, starts_at=auction.starts_at,
            ends_at=auction.ends_at, extension_enabled=auction.extension_enabled,
            extension_minutes=auction.extension_minutes, server_time=now,
            vehicle=CatalogueVehicle.from_vehicle(auction.vehicle),
        )


class AuctionHistoryEntry(BaseModel):
    action: str
    actor_id: Optional[uuid.UUID]
    actor_role: str
    details: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminAuctionOut(BaseModel):
    id: uuid.UUID
    vehicle_id: uuid.UUID
    status: str
    phase: str
    result: Optional[str]
    starting_price: Decimal
    current_price: Optional[Decimal]
    current_winner_id: Optional[uuid.UUID]
    bid_count: int
    # The Without RC ladder, admin-side: both rates go to the insurer.
    starting_price_without_rc: Optional[Decimal] = None
    current_price_without_rc: Optional[Decimal] = None
    current_winner_without_rc_id: Optional[uuid.UUID] = None
    bid_count_without_rc: int = 0
    starts_at: datetime
    ends_at: datetime
    scheduled_ends_at: datetime
    paused_at: Optional[datetime]
    extension_enabled: bool
    extension_minutes: int
    created_by_id: uuid.UUID
    created_at: datetime
    closed_at: Optional[datetime]
    server_time: datetime
    vehicle_title: Optional[str] = None       # when the vehicle was loaded with the auction
    registration_number: Optional[str] = None
    category: Optional[str] = None
    cover_photo_id: Optional[uuid.UUID] = None   # when the vehicle's photos were loaded too

    @classmethod
    def build(cls, auction, now: datetime) -> "AdminAuctionOut":
        skip = ("phase", "server_time", "vehicle_title", "registration_number", "category", "cover_photo_id")
        fields = {name: getattr(auction, name) for name in cls.model_fields if name not in skip}
        extra = {}
        if "vehicle" not in sa_inspect(auction).unloaded:
            v = auction.vehicle
            extra = {"vehicle_title": f"{v.manufacturing_year} {v.make} {v.model} {v.variant} ({v.registration_number})",
                     "registration_number": v.registration_number, "category": v.category}
            if "photos" not in sa_inspect(v).unloaded and v.photos:
                extra["cover_photo_id"] = v.photos[0].id
        return cls(**fields, phase=auction.phase(now), server_time=now, **extra)


class AdminAuctionDetail(AdminAuctionOut):
    history: List[AuctionHistoryEntry]


class AdminResultBid(BaseModel):
    bidder_name: str
    bidder_email: str
    amount: Decimal
    created_at: datetime


class AdminResultRow(BaseModel):
    """One finished auction: who won and for how much (admin Results screen)."""
    auction_id: uuid.UUID
    vehicle_id: uuid.UUID
    vehicle_title: str
    registration_number: str
    category: str
    result: Optional[str]
    starting_price: Decimal
    winning_amount: Optional[Decimal]
    bid_count: int
    starting_price_without_rc: Optional[Decimal] = None
    highest_without_rc: Optional[Decimal] = None     # the best Without RC rate, to quote the insurer
    bid_count_without_rc: int = 0
    closed_at: Optional[datetime]
    winner_id: Optional[uuid.UUID] = None
    winner_name: Optional[str] = None
    winner_email: Optional[str] = None
    winner_mobile: Optional[str] = None
    winner_buyer_id: Optional[str] = None
    order_id: Optional[uuid.UUID] = None
    order_number: Optional[str] = None
    order_status: Optional[str] = None
    cover_photo_id: Optional[uuid.UUID] = None
    approved_amount: Optional[Decimal] = None
    service_fee: Optional[Decimal] = None
    fee_received: Optional[Decimal] = None
    fee_pending: Optional[Decimal] = None


class AdminResultDetail(AdminResultRow):
    location: str
    starts_at: datetime
    ends_at: datetime
    winner_organization: Optional[str] = None
    winner_kyc_status: Optional[str] = None
    winner_since: Optional[datetime] = None
    winner_is_active: Optional[bool] = None
    order_due_at: Optional[datetime] = None
    order_utr: Optional[str] = None
    order_payment_submitted_at: Optional[datetime] = None
    order_paid_at: Optional[datetime] = None
    top_bids: List[AdminResultBid] = []
    claim_number: Optional[str] = None
    deal: Optional[dict] = None              # DealOut (approved amount / date, service fee, fee entries)
