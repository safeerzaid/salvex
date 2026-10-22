from typing import AsyncGenerator, Tuple
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from app.core.config import settings
from app.core.db_url import is_local_host, ssl_mode

logger = logging.getLogger("salvex.db")

if not is_local_host(settings.DATABASE_URL) and ssl_mode(settings.DATABASE_URL) in (None, "disable", "allow", "prefer"):
    # Never logs the URL itself
    logger.warning(
        "DATABASE_URL points to a remote host without a required SSL mode; "
        "traffic may be unencrypted. Add ?sslmode=require (or verify-full) to the URL."
    )

# Create Async Engine targeting PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_timeout=30.0
)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_db_connectivity() -> Tuple[bool, str]:
    """
    Safely ping the PostgreSQL database to verify connectivity.
    Returns (True, "connected") if query succeeds.
    Returns (False, safe_error_message) if connection fails.
    Does not expose sensitive credentials.
    """
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            val = result.scalar()
            if val == 1:
                return True, "database_connected"
            return False, "unexpected_query_result"
    except Exception as e:
        logger.error(f"Database readiness check failed: {type(e).__name__}")
        # Return generic safe status without credentials or internal traces
        return False, f"database_unreachable: {type(e).__name__}"
