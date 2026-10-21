import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Numeric, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Bid(Base):
    """
    Bid entity representing bids placed on vehicle lots.
    Preserves exact legacy bidType enum: 'standard', 'quick', 'proxy'.
    Uses Numeric(14, 2) for amount to eliminate float precision errors.
    Preserves legacy 'timestamp' as well as standard record 'created_at'.
    """
    __tablename__ = "bids"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    lot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vehicle_lots.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    bidder_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False
    )
    
    bid_type: Mapped[str] = mapped_column(
        SQLEnum("standard", "quick", "proxy", name="bid_type_enum", native_enum=False),
        default="standard",
        nullable=False
    )

    # Legacy bid timestamp preserved explicitly
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    lot: Mapped["VehicleLot"] = relationship("VehicleLot", back_populates="bids")
    bidder: Mapped["User"] = relationship("User", back_populates="bids")

    def __repr__(self) -> str:
        return f"<Bid {self.amount} on lot {self.lot_id} by {self.bidder_id}>"
