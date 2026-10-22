"""
Guards that make sure automated tests can only ever use a LOCAL, dedicated test database.

Rules enforced for the database URL tests use:
  1. It must be set explicitly (see below). Missing configuration stops the run.
  2. The host must be this computer (localhost / 127.0.0.1 / ::1). Remote hosts are refused.
  3. The database name must contain "test".
  4. It must not be the same database as the development URL in backend/.env.

How the test database URL is chosen (first match wins, and a bad value is an error, never skipped):
  1. TEST_DATABASE_URL environment variable
  2. TEST_DATABASE_URL line in backend/.env
  3. Derived from LOCAL_DATABASE_URL (or DATABASE_URL, only if it is local) in backend/.env:
     same local server and login, but database name "salvex_test_db".

Error messages never contain a URL, user name or password.
"""
import os
from pathlib import Path
from typing import Iterable, Mapping, Optional
from urllib.parse import urlsplit, urlunsplit

from dotenv import dotenv_values

from app.core.db_url import LOCAL_HOSTS, to_async_url

DEFAULT_TEST_DB_NAME = "salvex_test_db"


class SafeTestDatabaseError(RuntimeError):
    """The test database configuration is missing or unsafe."""


def _db_name(url: str) -> str:
    return urlsplit(url).path.lstrip("/")


def _identity(url: str):
    p = urlsplit(url)
    return ((p.hostname or "").lower(), p.port or 5432, p.path.lstrip("/"))


def _to_asyncpg_scheme(url: str) -> str:
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            url = "postgresql+asyncpg://" + url[len(prefix):]
    return url


def assert_safe_test_url(url: Optional[str], protected_urls: Iterable[str] = ()) -> str:
    """Return the url (asyncpg form) if it is safe for tests; otherwise raise SafeTestDatabaseError."""
    if not url:
        raise SafeTestDatabaseError("no test database is configured.")
    if not url.startswith(("postgresql://", "postgresql+asyncpg://", "postgres://")):
        raise SafeTestDatabaseError("the test database URL is not a PostgreSQL URL.")
    host = (urlsplit(url).hostname or "").lower()
    if host not in LOCAL_HOSTS:
        raise SafeTestDatabaseError(
            "the test database is not on this computer. Tests may only use a local database."
        )
    if "test" not in _db_name(url).lower():
        raise SafeTestDatabaseError('the test database name must contain the word "test".')
    for protected in protected_urls:
        if protected and _identity(protected) == _identity(url):
            raise SafeTestDatabaseError("the test database is the same as the development database.")
    return to_async_url(_to_asyncpg_scheme(url))


def _derive(url: str) -> Optional[str]:
    """Same local server and login as url, but with the dedicated test database name."""
    if (urlsplit(url).hostname or "").lower() not in LOCAL_HOSTS:
        return None
    p = urlsplit(url)
    return urlunsplit((p.scheme, p.netloc, "/" + DEFAULT_TEST_DB_NAME, "", ""))


def resolve_test_database_url(env_file: Path, environ: Mapping[str, str]) -> str:
    file_values = dotenv_values(env_file) if Path(env_file).exists() else {}
    protected = [file_values.get(k) for k in ("DATABASE_URL", "LOCAL_DATABASE_URL")]
    protected.append(environ.get("DATABASE_URL"))

    explicit = environ.get("TEST_DATABASE_URL") or file_values.get("TEST_DATABASE_URL")
    if explicit:
        return assert_safe_test_url(explicit, protected)

    for key in ("LOCAL_DATABASE_URL", "DATABASE_URL"):
        derived = _derive(file_values.get(key) or "")
        if derived:
            return assert_safe_test_url(derived, protected)

    raise SafeTestDatabaseError(
        "no local test database is configured. Set TEST_DATABASE_URL to a LOCAL database "
        'whose name contains "test" (for example salvex_test_db), or keep a local '
        "LOCAL_DATABASE_URL in backend/.env."
    )


def safe_test_url() -> str:
    """The URL for test fixtures to connect to. Re-checks safety on every call."""
    return assert_safe_test_url(os.environ.get("DATABASE_URL"))
