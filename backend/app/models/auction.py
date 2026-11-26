"""
Auctions (Module 5). An auction sells one APPROVED vehicle; the vehicle itself lives in `vehicles`.

Stored status (changed only by explicit actions and the closer):
    scheduled -> paused -> scheduled ...      (admin pause / resume)
    scheduled | paused -> closed              (end time passed and closed, or admin closes early)
    scheduled | paused -> cancelled           (admin cancels)
The PHASE shown to people is derived from the stored status and the SERVER clock, so an auction becomes
"live" at its start time without any job having to flip it:
    upcoming (before starts_at) -> live (starts_at <= now < ends_at) -> closing (ends_at passed, not yet
    closed) -> ended (closed) ; plus paused / cancelled.
`result` is set when closed: sold (it had a highest bid) or no_sale.

Money is stored as NUMERIC(14, 2) and handled as Decimal, never float. The bid fields (current_price,
current_winner_id, bid_count) are maintained by the bidding engine (Module 6).
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, SmallInteger, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

AUCTION_STATUSES = ("scheduled", "paused", "closed", "cancelled")
OPEN_STATUSES = ("scheduled", "paused")
RESULTS = ("sold", "no_sale")
PHASES = ("upcoming", "live", "closing", "paused", "ended", "cancelled")


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Auction(Base):
    __tablename__ = "auctions"
    __table_args__ = (
        CheckConstraint("status IN ('scheduled', 'paused', 'closed', 'cancelled')", name="ck_auctions_status"),
        CheckConstraint("result IS NULL OR result IN ('sold', 'no_sale')", name="ck_auctions_result"),
        CheckConstraint("(status = 'closed') = (result IS NOT NULL)", name="ck_auctions_result_only_when_closed"),
        CheckConstraint("starting_price > 0", name="ck_auctions_starting_price_positive"),
        CheckConstraint("ends_at > starts_at", name="ck_auctions_ends_after_start"),
        CheckConstraint("extension_minutes BETWEEN 1 AND 60", name="ck_auctions_extension_minutes"),
        CheckConstraint("bid_count >= 0", name="ck_auctions_bid_count"),
        CheckConstraint("current_price IS NULL OR current_price >= starting_price", name="ck_auctions_current_price"),
        CheckConstraint("starting_price_without_rc IS NULL OR starting_price_without_rc > 0",
                        name="ck_auctions_starting_price_without_rc_positive"),
        CheckConstraint("current_price_without_rc IS NULL OR starting_price_without_rc IS NULL"
                        " OR current_price_without_rc >= starting_price_without_rc",
                        name="ck_auctions_current_price_without_rc"),
        CheckConstraint("bid_count_without_rc >= 0", name="ck_auctions_bid_count_without_rc"),
        # One open auction per vehicle at a time.
        Index("uq_auctions_one_open_per_vehicle", "vehicle_id", unique=True,
              postgresql_where=text("status IN ('scheduled', 'paused')")),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="scheduled", index=True, nullable=False)
    result: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    starting_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    current_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)       # highest bid
    current_winner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=True
    )
    bid_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # The second ladder: the same vehicle bid for WITHOUT its RC (client, 2026-11-26). The columns
    # above are the With RC ladder. starting_price_without_rc is optional - with no expected amount
    # set, any first bid in this ladder is accepted.
    starting_price_without_rc: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    current_price_without_rc: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    current_winner_without_rc_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=True
    )
    bid_count_without_rc: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    scheduled_ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)  # before extensions
    paused_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Late-bid time extension, switched on/off by the admin per auction: when a bid arrives with less than
    # `extension_minutes` left, the end moves to now + `extension_minutes`.
    extension_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    extension_minutes: Mapped[int] = mapped_column(SmallInteger, default=2, nullable=False)

    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", lazy="raise")

    def phase(self, now: Optional[datetime] = None) -> str:
        now = now or _now()
        if self.status == "cancelled":
            return "cancelled"
        if self.status == "closed":
            return "ended"
        if self.status == "paused":
            return "paused"
        if now < self.starts_at:
            return "upcoming"
        if now < self.ends_at:
            return "live"
        return "closing"

    def __repr__(self) -> str:
        return f"<Auction {self.id} vehicle={self.vehicle_id} {self.status}>"
