"""
Database-free tests (fake URLs only) for:
  - the guards that keep tests on a LOCAL test database
  - the SSL option translation between asyncpg (?ssl=) and psycopg2/Alembic (?sslmode=)
"""
import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.core.db_url import host_of, is_local_host, ssl_mode, to_async_url, to_sync_url
from safe_db import (
    DEFAULT_TEST_DB_NAME,
    SafeTestDatabaseError,
    assert_safe_test_url,
    resolve_test_database_url,
)

LOCAL_DEV = "postgresql+asyncpg://dev_user:dev_pw@localhost:5432/salvex_auction"
REMOTE = "postgres://someone:somepw@db.example.invalid:5432/postgres"


# ---------------- test-database guards ----------------

def _env_file(tmp_path, text):
    f = tmp_path / ".env"
    f.write_text(text, encoding="utf-8")
    return f


def test_guard_refuses_missing_configuration(tmp_path):
    with pytest.raises(SafeTestDatabaseError, match="no local test database"):
        resolve_test_database_url(tmp_path / "missing.env", {})


def test_guard_refuses_remote_only_configuration(tmp_path):
    env = _env_file(tmp_path, f"DATABASE_URL={REMOTE}\n")
    with pytest.raises(SafeTestDatabaseError, match="no local test database"):
        resolve_test_database_url(env, {})


@pytest.mark.parametrize("bad", [
    REMOTE,
    "postgresql+asyncpg://u:p@db.example.invalid:5432/salvex_test_db",  # remote host, test-looking name
    "postgresql+asyncpg://u:p@localhost:5432/salvex_auction",           # local but not a test database
    "mysql://u:p@localhost:3306/test",                                   # not PostgreSQL
])
def test_guard_refuses_unsafe_urls(bad):
    with pytest.raises(SafeTestDatabaseError):
        assert_safe_test_url(bad)


def test_guard_error_messages_never_contain_the_url():
    secret_url = "postgres://someone:SuperSecretPw9@db.example.invalid:5432/postgres"
    with pytest.raises(SafeTestDatabaseError) as exc:
        assert_safe_test_url(secret_url)
    text = str(exc.value)
    assert "SuperSecretPw9" not in text and "db.example.invalid" not in text and "someone" not in text


def test_explicit_remote_test_url_is_an_error_not_a_silent_fallback(tmp_path):
    env = _env_file(tmp_path, f"DATABASE_URL={LOCAL_DEV}\n")
    with pytest.raises(SafeTestDatabaseError):
        resolve_test_database_url(env, {"TEST_DATABASE_URL": REMOTE})


def test_explicit_test_url_equal_to_dev_database_is_refused(tmp_path):
    dev = "postgresql+asyncpg://u:p@localhost:5432/my_test_dev"
    env = _env_file(tmp_path, f"DATABASE_URL={dev}\n")
    with pytest.raises(SafeTestDatabaseError, match="same as the development"):
        resolve_test_database_url(env, {"TEST_DATABASE_URL": dev})


def test_derives_local_test_database_from_local_dev_login(tmp_path):
    env = _env_file(tmp_path, f"DATABASE_URL={LOCAL_DEV}\n")
    url = resolve_test_database_url(env, {})
    assert url == f"postgresql+asyncpg://dev_user:dev_pw@localhost:5432/{DEFAULT_TEST_DB_NAME}"


def test_derives_from_local_backup_line_when_database_url_is_remote(tmp_path):
    env = _env_file(tmp_path, f"DATABASE_URL={REMOTE}\nLOCAL_DATABASE_URL={LOCAL_DEV}\n")
    url = resolve_test_database_url(env, {})
    assert url.endswith(f"@localhost:5432/{DEFAULT_TEST_DB_NAME}")


def test_environment_variable_is_used_and_normalized(tmp_path):
    env = _env_file(tmp_path, f"DATABASE_URL={LOCAL_DEV}\n")
    url = resolve_test_database_url(env, {"TEST_DATABASE_URL": "postgresql://u:p@127.0.0.1:5432/other_test"})
    assert url == "postgresql+asyncpg://u:p@127.0.0.1:5432/other_test"


def test_suite_is_actually_pointed_at_a_safe_database():
    """The settings the whole test run uses must be the guarded local test database."""
    from app.core.config import settings
    assert_safe_test_url(settings.DATABASE_URL, [LOCAL_DEV])
    assert settings.APP_ENV == "test"


# ---------------- SSL option translation ----------------

BASE = "postgresql+asyncpg://user:p%40ss@host.example.invalid:5432/dbname"


@pytest.mark.parametrize("given", ["sslmode=require", "ssl=require"])
def test_app_url_uses_ssl_spelling(given):
    assert to_async_url(f"{BASE}?{given}") == f"{BASE}?ssl=require"


@pytest.mark.parametrize("given", ["sslmode=require", "ssl=require"])
def test_alembic_url_uses_sslmode_spelling_and_plain_scheme(given):
    assert to_sync_url(f"{BASE}?{given}") == BASE.replace("+asyncpg", "") + "?sslmode=require"


def test_strong_modes_pass_through_unchanged():
    assert to_async_url(f"{BASE}?sslmode=verify-full").endswith("?ssl=verify-full")
    assert to_sync_url(f"{BASE}?ssl=verify-ca").endswith("?sslmode=verify-ca")


def test_other_query_options_and_credentials_are_left_untouched():
    out = to_sync_url(f"{BASE}?application_name=salvex&sslmode=require&connect_timeout=5")
    assert out.startswith("postgresql://user:p%40ss@host.example.invalid:5432/dbname?")
    assert "application_name=salvex" in out and "connect_timeout=5" in out and out.endswith("sslmode=require")


def test_url_without_ssl_option_is_never_changed():
    assert to_async_url(BASE) == BASE
    assert to_sync_url(BASE) == BASE.replace("+asyncpg", "")
    assert ssl_mode(BASE) is None


def test_boolean_style_values_map_to_safe_modes():
    assert to_async_url(f"{BASE}?ssl=true").endswith("ssl=require")
    assert to_async_url(f"{BASE}?ssl=false").endswith("ssl=disable")


def test_unknown_or_conflicting_ssl_values_are_errors_not_silently_ignored():
    with pytest.raises(ValueError):
        to_async_url(f"{BASE}?sslmode=banana")
    with pytest.raises(ValueError):
        to_async_url(f"{BASE}?ssl=require&sslmode=disable")
    # same value written both ways is fine
    assert to_async_url(f"{BASE}?ssl=require&sslmode=require").endswith("ssl=require")


def test_host_helpers():
    assert host_of(BASE) == "host.example.invalid"
    assert host_of("postgresql://u:p@[::1]:5432/x") == "::1"
    assert is_local_host("postgresql://u:p@LOCALHOST/x")
    assert not is_local_host(BASE)


def test_settings_translate_url_for_both_drivers(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgres://u:p@host.example.invalid:5432/dbname?sslmode=require")
    s = Settings(_env_file=None)
    assert s.DATABASE_URL == "postgresql+asyncpg://u:p@host.example.invalid:5432/dbname?ssl=require"
    assert s.sync_database_url == "postgresql://u:p@host.example.invalid:5432/dbname?sslmode=require"


def test_settings_errors_never_echo_the_database_url(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgres://u:TopSecretPw7@host.example.invalid:5432/db?sslmode=banana")
    with pytest.raises(ValidationError) as exc:
        Settings(_env_file=None)
    assert "TopSecretPw7" not in str(exc.value)
    assert "host.example.invalid" not in str(exc.value)
