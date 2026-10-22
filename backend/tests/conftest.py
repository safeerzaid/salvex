import os
from pathlib import Path

import pytest

from safe_db import SafeTestDatabaseError, assert_safe_test_url, resolve_test_database_url

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


def pytest_configure(config):
    """
    Point the whole app at a LOCAL test database before any application module is imported.
    If no safe test database is configured, the run stops here, before anything connects.
    """
    try:
        test_url = resolve_test_database_url(ENV_FILE, os.environ)
    except SafeTestDatabaseError as exc:
        raise pytest.UsageError(f"Refusing to run tests: {exc}") from None

    os.environ["APP_ENV"] = "test"
    os.environ["APP_SECRET_KEY"] = "test_secret_key_minimum_32_characters_long_for_salvex_unit_tests"
    os.environ["DATABASE_URL"] = test_url  # overrides backend/.env for the app, Alembic and tests
    os.environ["FRONTEND_ORIGINS"] = "http://localhost:5173"


@pytest.fixture(scope="session", autouse=True)
def _enforce_local_test_database():
    """Safety net: fail if the app settings somehow point anywhere but the local test database."""
    from app.core.config import settings

    try:
        assert_safe_test_url(settings.DATABASE_URL)
    except SafeTestDatabaseError as exc:
        pytest.exit(f"Refusing to run tests: application database is unsafe: {exc}", returncode=2)
