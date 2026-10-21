import asyncio
import sys
from app.core.config import settings
from app.db.session import engine, check_db_connectivity
from sqlalchemy import text

async def test_connection():
    print("Testing PostgreSQL connection to database: salvex_auction...")
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            val = result.scalar()
            if val == 1:
                print("DATABASE CONNECTION TEST: PASS (SELECT 1 returned 1)")
                is_ready, msg = await check_db_connectivity()
                print(f"READINESS CHECK: {'PASS' if is_ready else 'FAIL'} ({msg})")
                sys.exit(0)
            else:
                print(f"DATABASE CONNECTION TEST: FAIL (Unexpected result: {val})")
                sys.exit(1)
    except Exception as e:
        print(f"DATABASE CONNECTION TEST: FAIL ({type(e).__name__})")
        sys.exit(1)
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection())
