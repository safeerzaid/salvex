import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Table, Column, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

# Association table for User Watchlist (Many-to-Many between User and VehicleLot)
user_watchlist = Table(
    "user_watchlist",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("lot_id", UUID(as_uuid=True), ForeignKey("vehicle_lots.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
)


class User(Base):
    """
    User entity representing institutional bidders, consignor sellers, and platform administrators.
    Preserves legacy Mongoose enum values and role semantics.
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    role: Mapped[str] = mapped_column(
        SQLEnum("bidder", "seller", "admin", name="user_role_enum", native_enum=False),
        default="bidder",
        server_default="bidder",
        insert_default="bidder",
        nullable=False,
        index=True
    )
    mobile: Mapped[str] = mapped_column(String(50), default="", server_default="", insert_default="", nullable=False)
    organization: Mapped[str] = mapped_column(String(255), default="", server_default="", insert_default="", nullable=False)
    
    kyc_status: Mapped[str] = mapped_column(
        SQLEnum("pending", "verified", "rejected", name="kyc_status_enum", native_enum=False),
        default="pending",
        server_default="pending",
        insert_default="pending",
        nullable=False,
        index=True
    )
    is_email_verified: Mapped[bool] = mapped_column(
        default=False,
        server_default="false",
        insert_default=False,
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        default=True,
        server_default="true",
        insert_default=True,
        nullable=False
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
    consignments: Mapped[list["VehicleLot"]] = relationship(
        "VehicleLot",
        back_populates="seller",
        foreign_keys="VehicleLot.seller_id"
    )
    bids: Mapped[list["Bid"]] = relationship(
        "Bid",
        back_populates="bidder",
        cascade="all, delete-orphan"
    )
    watchlist: Mapped[list["VehicleLot"]] = relationship(
        "VehicleLot",
        secondary=user_watchlist,
        back_populates="watchers"
    )
    auth_tokens: Mapped[list["AuthToken"]] = relationship(
        "AuthToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"


class AuthToken(Base):
    """
    Stores cryptographically hashed verification codes and password reset secrets.
    Never stores plaintext OTPs. Enforces expiry, single-use, and attempt limiting.
    """
    __tablename__ = "auth_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    purpose: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    attempts: Mapped[int] = mapped_column(default=0, server_default="0", insert_default=0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(default=5, server_default="5", insert_default=5, nullable=False)
    is_used: Mapped[bool] = mapped_column(default=False, server_default="false", insert_default=False, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="auth_tokens")

    def __repr__(self) -> str:
        return f"<AuthToken {self.purpose} for user={self.user_id} (used={self.is_used})>"

