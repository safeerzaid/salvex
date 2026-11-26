"""
The database layout must match the models, and the migration chain must be a single line.
(Upgrade/downgrade round trips change the schema of the shared test database, so they are run
by hand rather than in this suite; see docs/AUTHENTICATION.md.)
"""
from pathlib import Path

from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect

import app.models  # noqa: F401  (registers every model)
from app.core.config import settings
from app.db.base import Base

BACKEND = Path(__file__).resolve().parent.parent


def script() -> ScriptDirectory:
    return ScriptDirectory.from_config(Config(str(BACKEND / "alembic.ini")))


def test_migration_history_is_a_single_line_ending_at_the_latest_migration():
    heads = script().get_heads()
    assert heads == ["a4d6b2f8c013"]
    revisions = [r.revision for r in script().walk_revisions()]
    assert revisions == ["a4d6b2f8c013", "e8a3c5f1b7d9", "d7f2b4c9e1a3", "c6e1f3a8d2b7", "b4d9f2a6c8e1", "a2c8e5f7b1d3", "f1a7c3e9d2b6", "d8f3a6c1e2b5", "c5d2e8f4a7b9", "b3f7a1d9c2e4", "a9e4d2c6b8f1", "f6c1a8e3b9d5", "e5b9c2d7f1a4", "d4a8f1c3e6b2", "b7e2c4d9a1f3", "8d1f6b2a9c47", "5c3e9a7b1f42", "a4d81c6e5b20", "7b2f4a9c1d3e", "c96cd80717e8", "493b43fb6f05"]


def test_the_test_database_is_at_the_latest_revision_and_matches_the_models():
    engine = create_engine(settings.sync_database_url)           # the isolated test database
    try:
        with engine.connect() as conn:
            context = MigrationContext.configure(conn)
            assert context.get_current_revision() == "a4d6b2f8c013"
            assert compare_metadata(context, Base.metadata) == []   # no drift between models and migrations
    finally:
        engine.dispose()


def test_auth_sessions_table_has_the_expected_shape():
    engine = create_engine(settings.sync_database_url)
    try:
        inspector = inspect(engine)
        columns = {c["name"]: c for c in inspector.get_columns("auth_sessions")}
        assert set(columns) == {"id", "user_id", "created_at", "last_seen_at", "expires_at", "revoked_at", "revoke_reason", "user_agent"}
        assert not columns["user_id"]["nullable"] and not columns["expires_at"]["nullable"]
        assert columns["revoked_at"]["nullable"]
        indexed = {tuple(i["column_names"]) for i in inspector.get_indexes("auth_sessions")}
        assert ("user_id",) in indexed and ("expires_at",) in indexed
        fk = inspector.get_foreign_keys("auth_sessions")[0]
        assert fk["referred_table"] == "users" and fk["options"].get("ondelete") == "CASCADE"
    finally:
        engine.dispose()
