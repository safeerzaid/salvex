"""
Bids on auctions (Module 6). Append-only: a database trigger rejects UPDATE, DELETE and TRUNCATE, so an
accepted bid can never be changed or removed. Every accepted bid is higher than the one before it, so
amounts are unique per auction (also enforced by the database).

The legacy `bids` table belongs to the unused legacy `vehicle_lots` model and is not used.
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AuctionBid(Base):
    __tablename__ = "auction_bids"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_auction_bids_amount_positive"),
        CheckConstraint("rc_option IN ('with_rc', 'without_rc')", name="ck_auction_bids_rc_option"),
        # Unique per ladder, not per auction: the same figure may be bid once With RC and once
        # Without RC without either blocking the other.
        UniqueConstraint("auction_id", "rc_option", "amount", name="uq_auction_bids_auction_option_amount"),
        # The same click sent twice (same key from the same bidder) is one bid.
        Index("uq_auction_bids_bidder_idempotency_key", "bidder_id", "idempotency_key", unique=True,
              postgresql_where=text("idempotency_key IS NOT NULL")),
        Index("ix_auction_bids_auction_created", "auction_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("auctions.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    bidder_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    # Which of the auction's two ladders this bid is in: the vehicle sold with its RC, or without it.
    # Every auction runs both (client, 2026-11-26); a bidder may use one or both.
    rc_option: Mapped[str] = mapped_column(String(12), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)  # server time
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    def __repr__(self) -> str:
        return f"<AuctionBid {self.amount} on {self.auction_id} by {self.bidder_id}>"
