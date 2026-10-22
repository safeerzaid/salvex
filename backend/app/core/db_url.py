"""
Helpers for PostgreSQL connection URLs.

The app (asyncpg) and Alembic (psycopg2) read the same DATABASE_URL, but they spell the
SSL option differently:
  - asyncpg understands  ?ssl=<mode>      and rejects ?sslmode=
  - psycopg2 understands ?sslmode=<mode>  and rejects ?ssl=

These helpers translate only that one option. Everything else in the URL (including the
username and password) is left byte-for-byte unchanged. SSL is never added, downgraded or
silently dropped: an unknown value raises an error instead.

Error messages never include the URL.
"""
from typing import Optional

_SSL_MODES = {"disable", "allow", "prefer", "require", "verify-ca", "verify-full"}
_TRUE = {"true", "1", "yes", "on"}
_FALSE = {"false", "0", "no", "off"}
_ASYNC_KEY, _SYNC_KEY = "ssl", "sslmode"
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}


def _normalize_mode(value: str) -> str:
    low = value.strip().lower()
    if low in _TRUE:
        return "require"
    if low in _FALSE:
        return "disable"
    if low in _SSL_MODES:
        return low
    raise ValueError(
        "Unsupported SSL option in DATABASE_URL. Use one of: " + ", ".join(sorted(_SSL_MODES))
    )


def _rewrite_ssl(url: str, target_key: str) -> str:
    """Return url with the SSL option spelled as target_key; all other text unchanged."""
    base, sep, query = url.partition("?")
    if not sep:
        return url
    other_key = _SYNC_KEY if target_key == _ASYNC_KEY else _ASYNC_KEY

    kept, found = [], {}
    for part in query.split("&"):
        if not part:
            continue
        key, eq, value = part.partition("=")
        if key in (target_key, other_key):
            found[key] = _normalize_mode(value if eq else "")
        else:
            kept.append(part)

    if not found:
        return url
    if len(found) == 2 and found[target_key] != found[other_key]:
        raise ValueError("DATABASE_URL has conflicting 'ssl' and 'sslmode' options.")
    mode = found.get(target_key, found.get(other_key))
    return base + "?" + "&".join(kept + [f"{target_key}={mode}"])


def to_async_url(url: str) -> str:
    """URL for the app: scheme must already be postgresql+asyncpg://; SSL spelled ?ssl=."""
    return _rewrite_ssl(url, _ASYNC_KEY)


def to_sync_url(url: str) -> str:
    """URL for Alembic (psycopg2): plain postgresql:// scheme; SSL spelled ?sslmode=."""
    if url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return _rewrite_ssl(url, _SYNC_KEY)


def ssl_mode(url: str) -> Optional[str]:
    """Normalized SSL mode requested in the URL, or None when the URL does not set one."""
    _, sep, query = url.partition("?")
    if not sep:
        return None
    for part in query.split("&"):
        key, eq, value = part.partition("=")
        if key in (_ASYNC_KEY, _SYNC_KEY):
            return _normalize_mode(value if eq else "")
    return None


def host_of(url: str) -> str:
    """Lower-cased host name of the URL ('' if none). Never includes credentials."""
    rest = url.split("://", 1)[-1].partition("?")[0].partition("/")[0]
    hostport = rest.rpartition("@")[2]
    if hostport.startswith("["):  # IPv6 literal
        return hostport[1:].partition("]")[0].lower()
    return hostport.partition(":")[0].lower()


def is_local_host(url: str) -> bool:
    return host_of(url) in LOCAL_HOSTS
