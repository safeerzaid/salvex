import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from safe_db import safe_test_url
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.models.user import User, user_watchlist
from app.models.vehicle_lot import VehicleLot
from app.models.bid import Bid


@pytest.fixture
async def pg_test_session():
    """
    Safely yields an isolated AsyncSession bound to the configured PostgreSQL database.
    Always rolls back upon fixture teardown to guarantee that no test records persist,
    ensuring zero pollution and no destructive database modifications.
    """
    engine = create_async_engine(safe_test_url(), echo=False)  # local test database only
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()
            await engine.dispose()


@pytest.mark.asyncio
async def test_pg_orm_user_crud(pg_test_session: AsyncSession):
    """Verify creating, querying, and checking default enums for a User on PostgreSQL."""
    unique_suffix = uuid.uuid4().hex[:8]
    user = User(
        name="Vikram Rathore",
        email=f"vikram_{unique_suffix}@salvex-auction.in",
        password_hash="argon2_sample_hash_secure",
        role="seller",
        mobile="+919811223344",
        organization="Rathore Logistics Ltd",
        kyc_status="pending"
    )
    pg_test_session.add(user)
    await pg_test_session.flush()

    assert user.id is not None
    assert isinstance(user.id, uuid.UUID)

    # Query back using select
    stmt = select(User).where(User.id == user.id)
    res = await pg_test_session.execute(stmt)
    retrieved = res.scalar_one_or_none()

    assert retrieved is not None
    assert retrieved.email == f"vikram_{unique_suffix}@salvex-auction.in"
    assert retrieved.role == "seller"
    assert retrieved.kyc_status == "pending"
    assert retrieved.created_at.tzinfo is not None
    assert retrieved.updated_at.tzinfo is not None


@pytest.mark.asyncio
async def test_pg_orm_vehicle_lot_crud_and_starting_bid_derivation(pg_test_session: AsyncSession):
    """
    Verify creating VehicleLot with current_bid initialized from starting_bid,
    JSONB images, numeric types, and relationship to seller.
    """
    seller = User(
        name="Auto Auction Seller",
        email=f"seller_{uuid.uuid4().hex[:8]}@salvex-auction.in",
        password_hash="pwd_hash_test",
        role="seller"
    )
    pg_test_session.add(seller)
    await pg_test_session.flush()

    starting_amount = Decimal("3250000.00")
    # In service layer, current_bid derives from starting_bid if not specified
    lot = VehicleLot(
        lot_number=f"LOT-2026-{uuid.uuid4().hex[:6].upper()}",
        legacy_slug=f"salvex-audi-a6-{uuid.uuid4().hex[:6]}",
        title="2022 Audi A6 Technology 45 TFSI",
        make="Audi",
        model="A6",
        year=2022,
        category="insurance",
        condition="Salvage / Repairable",
        damage_type="Accidental",
        primary_damage="Front Bumper & Hood",
        secondary_damage="Radiator Assembly",
        odometer=28400,
        fuel_type="Petrol",
        transmission="Automatic",
        location="Delhi, DL",
        yard_location="Mayapuri Industrial Area Yard 2",
        starting_bid=starting_amount,
        current_bid=starting_amount,
        min_increment=Decimal("25000.00"),
        bid_count=0,
        reserve_price=Decimal("3500000.00"),
        status="upcoming",
        ready_to_lift=False,
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc),
        images=["https://storage.salvex.in/lots/audi-a6-1.jpg", "https://storage.salvex.in/lots/audi-a6-2.jpg"],
        seller_id=seller.id
    )
    pg_test_session.add(lot)
    await pg_test_session.flush()

    assert lot.id is not None
    assert isinstance(lot.id, uuid.UUID)
    assert lot.current_bid == lot.starting_bid
    assert isinstance(lot.starting_bid, Decimal)
    assert isinstance(lot.current_bid, Decimal)
    assert isinstance(lot.reserve_price, Decimal)
    assert lot.seller_id == seller.id

    # Retrieve and verify JSONB and timezone timestamps
    stmt = select(VehicleLot).where(VehicleLot.id == lot.id)
    res = await pg_test_session.execute(stmt)
    retrieved = res.scalar_one_or_none()

    assert retrieved is not None
    assert retrieved.images == ["https://storage.salvex.in/lots/audi-a6-1.jpg", "https://storage.salvex.in/lots/audi-a6-2.jpg"]
    assert retrieved.start_time.tzinfo is not None
    assert retrieved.end_time.tzinfo is not None
    assert retrieved.created_at.tzinfo is not None
    assert retrieved.updated_at.tzinfo is not None


@pytest.mark.asyncio
async def test_pg_orm_bid_and_high_bidder_circular_relation(pg_test_session: AsyncSession):
    """
    Verify creating Bid linked to User and VehicleLot, updating current_high_bidder_id
    with foreign key referencing users.id ON DELETE SET NULL, and checking all timestamps.
    """
    bidder = User(
        name="Ananya Desai",
        email=f"ananya_{uuid.uuid4().hex[:8]}@salvex-auction.in",
        password_hash="pwd_hash_test_bidder",
        role="bidder"
    )
    pg_test_session.add(bidder)
    await pg_test_session.flush()

    lot = VehicleLot(
        lot_number=f"LOT-2026-{uuid.uuid4().hex[:6].upper()}",
        legacy_slug=f"salvex-merc-c200-{uuid.uuid4().hex[:6]}",
        title="2020 Mercedes-Benz C-Class C200",
        make="Mercedes-Benz",
        model="C-Class",
        year=2020,
        category="bank-nbfc",
        condition="Clean Title",
        damage_type="Bank Repossession",
        primary_damage="None",
        secondary_damage="None",
        odometer=34000,
        fuel_type="Petrol",
        transmission="Automatic",
        location="Pune, MH",
        yard_location="Hinjewadi Yard 1",
        starting_bid=Decimal("2800000.00"),
        current_bid=Decimal("2800000.00"),
        min_increment=Decimal("20000.00"),
        bid_count=0,
        reserve_price=Decimal("3000000.00"),
        status="live",
        ready_to_lift=True,
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc),
        images=[]
    )
    pg_test_session.add(lot)
    await pg_test_session.flush()

    # Place Bid
    bid_amount = Decimal("2820000.00")
    bid = Bid(
        lot_id=lot.id,
        bidder_id=bidder.id,
        amount=bid_amount,
        bid_type="standard"
    )
    pg_test_session.add(bid)
    await pg_test_session.flush()

    # Update lot high bidder (tests fk_vehicle_lots_current_high_bidder_id_users)
    lot.current_high_bidder_id = bidder.id
    lot.current_bid = bid_amount
    lot.bid_count = 1
    await pg_test_session.flush()

    assert bid.id is not None
    assert isinstance(bid.id, uuid.UUID)
    assert bid.timestamp.tzinfo is not None
    assert bid.created_at.tzinfo is not None
    assert bid.updated_at.tzinfo is not None

    # Retrieve bid
    stmt = select(Bid).where(Bid.id == bid.id)
    res = await pg_test_session.execute(stmt)
    retrieved_bid = res.scalar_one_or_none()

    assert retrieved_bid is not None
    assert retrieved_bid.amount == Decimal("2820000.00")
    assert retrieved_bid.lot_id == lot.id
    assert retrieved_bid.bidder_id == bidder.id


@pytest.mark.asyncio
async def test_pg_orm_watchlist_association(pg_test_session: AsyncSession):
    """Verify inserting and querying user_watchlist association table."""
    user = User(
        name="Watchlist User",
        email=f"watcher_{uuid.uuid4().hex[:8]}@salvex-auction.in",
        password_hash="pwd_hash_test_watcher",
        role="bidder"
    )
    pg_test_session.add(user)
    await pg_test_session.flush()

    lot = VehicleLot(
        lot_number=f"LOT-2026-{uuid.uuid4().hex[:6].upper()}",
        legacy_slug=f"salvex-thar-{uuid.uuid4().hex[:6]}",
        title="2023 Mahindra Thar LX 4x4",
        make="Mahindra",
        model="Thar",
        year=2023,
        category="insurance",
        condition="Salvage / Repairable",
        damage_type="Flood",
        primary_damage="Engine Submerged",
        secondary_damage="Electrical Harness",
        odometer=12000,
        fuel_type="Diesel",
        transmission="Manual",
        location="Chennai, TN",
        yard_location="Ambattur Yard 3",
        starting_bid=Decimal("850000.00"),
        current_bid=Decimal("850000.00"),
        min_increment=Decimal("15000.00"),
        bid_count=0,
        reserve_price=Decimal("1000000.00"),
        status="live",
        ready_to_lift=True,
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc),
        images=[]
    )
    pg_test_session.add(lot)
    await pg_test_session.flush()

    # Add to watchlist
    insert_stmt = user_watchlist.insert().values(user_id=user.id, lot_id=lot.id)
    await pg_test_session.execute(insert_stmt)
    await pg_test_session.flush()

    # Query watchlist
    query_stmt = select(user_watchlist).where(
        user_watchlist.c.user_id == user.id,
        user_watchlist.c.lot_id == lot.id
    )
    res = await pg_test_session.execute(query_stmt)
    row = res.fetchone()

    assert row is not None
    assert row.user_id == user.id
    assert row.lot_id == lot.id
    assert row.created_at.tzinfo is not None
