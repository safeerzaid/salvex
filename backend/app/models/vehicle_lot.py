import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import String, Integer, Boolean, DateTime, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.user import user_watchlist


class VehicleLot(Base):
    """
    VehicleLot entity representing auction lots.
    Preserves exact legacy status values: 'upcoming', 'live', 'ended', 'settled'.
    Preserves legacy category and condition enums.
    Uses Numeric(14, 2) for financial fields to eliminate float precision issues.
    Includes legacy_slug to seamlessly map frontend IDs ('salvex-101', 'salvex-bmw-x5') to UUIDs.
    """
    __tablename__ = "vehicle_lots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    # Legacy slug allowing direct compatibility with frontend mock IDs ('salvex-101', etc.)
    legacy_slug: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True, nullable=True)
    
    lot_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    make: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    vin: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)

    # Legacy category enum exactly matching Mongoose schema
    category: Mapped[str] = mapped_column(
        SQLEnum('insurance', 'bank-nbfc', 'used-vehicle', 'used-spare-parts', name='lot_category_enum', native_enum=False),
        default='insurance',
        nullable=False,
        index=True
    )
    # Legacy condition enum exactly matching Mongoose schema
    condition: Mapped[str] = mapped_column(
        SQLEnum('Clean Title', 'Salvage / Repairable', 'Bank Repossession', 'Parts Only', name='lot_condition_enum', native_enum=False),
        default='Salvage / Repairable',
        nullable=False
    )

    damage_type: Mapped[str] = mapped_column(String(100), default='Front End Impact', nullable=False)
    primary_damage: Mapped[str] = mapped_column(String(150), default='Front Bumper / Radiator Core', nullable=False)
    secondary_damage: Mapped[str] = mapped_column(String(150), default='Hood & Left Fender', nullable=False)
    
    odometer: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    fuel_type: Mapped[str] = mapped_column(String(50), default='Diesel', nullable=False)
    transmission: Mapped[str] = mapped_column(String(50), default='Automatic', nullable=False)
    location: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    yard_location: Mapped[str] = mapped_column(String(255), default='Bengaluru Central Salvage Yard', nullable=False)

    # Financial & Bidding fields — Exact Numeric(14, 2)
    starting_bid: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    current_bid: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    min_increment: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal('25000.00'), nullable=False)
    bid_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reserve_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal('0.00'), nullable=False)

    # EXACT legacy status values preserved: upcoming, live, ended, settled
    status: Mapped[str] = mapped_column(
        SQLEnum('upcoming', 'live', 'ended', 'settled', name='lot_status_enum', native_enum=False),
        default='upcoming',
        nullable=False,
        index=True
    )
    ready_to_lift: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Timezone-aware auction window
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)

    # Images stored as JSONB list of URL strings
    images: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)

    # Foreign Keys
    seller_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    current_high_bidder_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", use_alter=True),
        nullable=True
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
    seller: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[seller_id],
        back_populates="consignments"
    )
    current_high_bidder: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[current_high_bidder_id]
    )
    bids: Mapped[list["Bid"]] = relationship(
        "Bid",
        back_populates="lot",
        cascade="all, delete-orphan",
        order_by="desc(Bid.created_at)"
    )
    watchers: Mapped[list["User"]] = relationship(
        "User",
        secondary=user_watchlist,
        back_populates="watchlist"
    )

    def __repr__(self) -> str:
        return f"<VehicleLot {self.lot_number}: {self.title} ({self.status})>"
