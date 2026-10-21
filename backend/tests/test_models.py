import uuid
from decimal import Decimal
from datetime import datetime, timezone
from app.db.base import Base
from app.models.user import User, user_watchlist
from app.models.vehicle_lot import VehicleLot
from app.models.bid import Bid


def test_models_registered_in_metadata():
    """Verify that all domain tables are registered in Base.metadata."""
    table_names = Base.metadata.tables.keys()
    assert "users" in table_names
    assert "vehicle_lots" in table_names
    assert "bids" in table_names
    assert "user_watchlist" in table_names


def test_user_model_instantiation():
    """Verify User model instantiation, schema defaults, and attributes."""
    user = User(
        name="Rahul Sharma",
        email="rahul@example.com",
        password_hash="hashed_pw_test",
        role="bidder",
        kyc_status="pending"
    )
    assert user.name == "Rahul Sharma"
    assert user.email == "rahul@example.com"
    assert user.role == "bidder"
    assert user.kyc_status == "pending"
    # Verify Column definitions preserve legacy defaults in metadata
    assert User.__table__.columns["role"].default.arg == "bidder"
    assert User.__table__.columns["kyc_status"].default.arg == "pending"
    assert User.__table__.columns["mobile"].default.arg == ""


def test_vehicle_lot_model_legacy_status_and_numerics():
    """Verify VehicleLot preserves exact legacy status, numeric precision, and defaults."""
    lot = VehicleLot(
        lot_number="LOT-2026-101",
        legacy_slug="salvex-101",
        title="2021 BMW X5 xDrive 30d",
        make="BMW",
        model="X5",
        year=2021,
        location="Bengaluru, KA",
        starting_bid=Decimal("4200000.00"),
        current_bid=Decimal("4850000.00"),
        status="upcoming",
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc)
    )
    # Check exact legacy status preserved
    assert lot.status == "upcoming"
    # Check table column metadata defaults
    assert VehicleLot.__table__.columns["status"].default.arg == "upcoming"
    assert VehicleLot.__table__.columns["category"].default.arg == "insurance"
    assert VehicleLot.__table__.columns["condition"].default.arg == "Salvage / Repairable"
    assert VehicleLot.__table__.columns["min_increment"].default.arg == Decimal("25000.00")
    # Check Numeric types
    assert isinstance(lot.starting_bid, Decimal)
    assert lot.starting_bid == Decimal("4200000.00")
    assert lot.legacy_slug == "salvex-101"



def test_bid_model_instantiation():
    """Verify Bid model attributes, foreign keys, and legacy timestamp preservation."""
    lot_id = uuid.uuid4()
    bidder_id = uuid.uuid4()
    bid = Bid(
        lot_id=lot_id,
        bidder_id=bidder_id,
        amount=Decimal("4900000.00"),
        bid_type="standard"
    )
    assert bid.lot_id == lot_id
    assert bid.bidder_id == bidder_id
    assert bid.amount == Decimal("4900000.00")
    assert bid.bid_type == "standard"
    # Verify Bid column metadata includes both created_at, updated_at, and domain timestamp
    assert "timestamp" in Bid.__table__.columns
    assert "created_at" in Bid.__table__.columns
    assert "updated_at" in Bid.__table__.columns
    assert Bid.__table__.columns["timestamp"].type.timezone is True
    assert Bid.__table__.columns["created_at"].type.timezone is True
    assert Bid.__table__.columns["updated_at"].type.timezone is True


def test_initial_migration_foreign_key_constraints():
    """Verify initial migration defines fk_vehicle_lots_current_high_bidder_id_users correctly."""
    from pathlib import Path
    migration_file = Path(__file__).resolve().parent.parent / "alembic" / "versions" / "493b43fb6f05_create_initial_core_schema.py"
    assert migration_file.exists(), "Initial migration file must exist"
    
    content = migration_file.read_text(encoding="utf-8")
    
    # Verify upgrade explicitly creates the foreign key constraint
    assert "fk_vehicle_lots_current_high_bidder_id_users" in content
    assert "op.create_foreign_key(" in content
    assert "'vehicle_lots'" in content
    assert "'users'" in content
    assert "['current_high_bidder_id']" in content
    assert "ondelete='SET NULL'" in content

    # Verify downgrade explicitly drops the constraint
    assert "op.drop_constraint('fk_vehicle_lots_current_high_bidder_id_users', 'vehicle_lots', type_='foreignkey')" in content
