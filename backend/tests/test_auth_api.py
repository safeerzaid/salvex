"""
HTTP-level auth tests: every call goes through the real FastAPI routes,
so commit/rollback behaviour in the endpoints is covered.

Database isolation: all requests share one connection with an outer
transaction that is always rolled back at the end. Each request gets its
own session that commits to a SAVEPOINT, so nothing is ever persisted.

The database is always the LOCAL test database chosen by tests/conftest.py
(see tests/safe_db.py); tests refuse to run against any other database.
"""
import logging
import uuid
from typing import Tuple

import pytest
from safe_db import safe_test_url
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.db.session import get_db
from app.main import app
from app.services.email import BaseEmailService, ConsoleEmailService

PASSWORD = "StrongPassword@2026"


class CapturingEmailService(BaseEmailService):
    def __init__(self):
        self.sent = []

    async def send_verification_otp(self, to_email: str, otp: str, user_name: str) -> Tuple[bool, str]:
        self.sent.append({"type": "verification", "to": to_email, "otp": otp})
        return True, "captured"

    async def send_password_reset_otp(self, to_email: str, otp: str, user_name: str) -> Tuple[bool, str]:
        self.sent.append({"type": "reset", "to": to_email, "otp": otp})
        return True, "captured"

    def last_otp(self, kind: str) -> str:
        return [m for m in self.sent if m["type"] == kind][-1]["otp"]


@pytest.fixture
async def api(monkeypatch):
    engine = create_async_engine(safe_test_url(), poolclass=NullPool)  # local test database only
    conn = await engine.connect()
    outer = await conn.begin()

    async def override_get_db():
        async with AsyncSession(
            bind=conn,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint",
        ) as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise

    mail = CapturingEmailService()
    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr("app.api.auth.get_email_service", lambda: mail)

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            yield client, mail
    finally:
        app.dependency_overrides.pop(get_db, None)
        await outer.rollback()
        await conn.close()
        await engine.dispose()


def _email(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}@salvex-test.in"


async def _register(client, email: str):
    res = await client.post("/api/auth/register", json={
        "name": "Api Test User", "email": email, "password": PASSWORD, "role": "bidder",
    })
    assert res.status_code == 201, res.text
    return res


async def _register_and_verify(client, mail, email: str):
    await _register(client, email)
    res = await client.post("/api/auth/verify-email", json={"email": email, "otp": mail.last_otp("verification")})
    assert res.status_code == 200, res.text


def _wrong_code(correct: str) -> str:
    return "000000" if correct != "000000" else "111111"


async def test_full_flow_register_verify_login_me_logout(api):
    client, mail = api
    email = _email("flow")

    await _register(client, email)

    # Duplicate registration is rejected
    dup = await client.post("/api/auth/register", json={"name": "Dup", "email": email, "password": PASSWORD})
    assert dup.status_code == 400

    # Login before verification is blocked
    res = await client.post("/api/auth/login", json={"identifier": email, "password": PASSWORD})
    assert res.status_code == 403

    otp = mail.last_otp("verification")
    wrong = _wrong_code(otp)

    # Two wrong codes: the second response proves the first attempt was saved
    res = await client.post("/api/auth/verify-email", json={"email": email, "otp": wrong})
    assert res.status_code == 400
    assert "4 attempt(s) remaining" in res.json()["detail"]
    res = await client.post("/api/auth/verify-email", json={"email": email, "otp": wrong})
    assert res.status_code == 400
    assert "3 attempt(s) remaining" in res.json()["detail"]

    # Correct code verifies
    res = await client.post("/api/auth/verify-email", json={"email": email, "otp": otp})
    assert res.status_code == 200

    # Login sets an HttpOnly cookie and returns a bearer token
    res = await client.post("/api/auth/login", json={"identifier": email, "password": PASSWORD})
    assert res.status_code == 200, res.text
    body = res.json()
    token = body["access_token"]
    assert body["user"]["email"] == email
    set_cookie = res.headers.get("set-cookie", "")
    assert "access_token=" in set_cookie and "httponly" in set_cookie.lower()

    # /me works with the cookie
    res = await client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == email

    # Logout tells the browser to delete the cookie
    res = await client.post("/api/auth/logout")
    assert res.status_code == 200
    assert 'access_token=""' in res.headers.get("set-cookie", "")
    assert "access_token" not in client.cookies
    res = await client.get("/api/auth/me")
    assert res.status_code == 401

    # /me works with the bearer token alone (no cookie)
    res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200


async def test_verification_code_locks_after_five_wrong_attempts(api):
    client, mail = api
    email = _email("lock")
    await _register(client, email)
    otp = mail.last_otp("verification")
    wrong = _wrong_code(otp)

    for _ in range(5):
        res = await client.post("/api/auth/verify-email", json={"email": email, "otp": wrong})
        assert res.status_code == 400

    # Even the correct code must now be refused
    res = await client.post("/api/auth/verify-email", json={"email": email, "otp": otp})
    assert res.status_code == 400
    assert "Too many failed attempts" in res.json()["detail"]

    # The account stays unverified
    res = await client.post("/api/auth/login", json={"identifier": email, "password": PASSWORD})
    assert res.status_code == 403


async def test_password_reset_flow(api):
    client, mail = api
    email = _email("reset")
    new_password = "NewSecretPassword456!"
    await _register_and_verify(client, mail, email)

    res = await client.post("/api/auth/forgot-password", json={"email": email})
    assert res.status_code == 200
    otp = mail.last_otp("reset")

    res = await client.post("/api/auth/reset-password", json={
        "email": email, "otp": _wrong_code(otp), "new_password": new_password,
    })
    assert res.status_code == 400
    assert "4 attempt(s) remaining" in res.json()["detail"]

    res = await client.post("/api/auth/reset-password", json={
        "email": email, "otp": otp, "new_password": new_password,
    })
    assert res.status_code == 200

    # The code is single-use
    res = await client.post("/api/auth/reset-password", json={
        "email": email, "otp": otp, "new_password": "AnotherPassword789!",
    })
    assert res.status_code == 400

    res = await client.post("/api/auth/login", json={"identifier": email, "password": PASSWORD})
    assert res.status_code == 401
    res = await client.post("/api/auth/login", json={"identifier": email, "password": new_password})
    assert res.status_code == 200


async def test_reset_code_locks_after_five_wrong_attempts(api):
    client, mail = api
    email = _email("resetlock")
    new_password = "NewSecretPassword456!"
    await _register_and_verify(client, mail, email)

    await client.post("/api/auth/forgot-password", json={"email": email})
    otp = mail.last_otp("reset")

    for _ in range(5):
        res = await client.post("/api/auth/reset-password", json={
            "email": email, "otp": _wrong_code(otp), "new_password": new_password,
        })
        assert res.status_code == 400

    res = await client.post("/api/auth/reset-password", json={
        "email": email, "otp": otp, "new_password": new_password,
    })
    assert res.status_code == 400
    assert "Too many failed attempts" in res.json()["detail"]

    # Password is unchanged
    res = await client.post("/api/auth/login", json={"identifier": email, "password": PASSWORD})
    assert res.status_code == 200


async def test_login_unknown_email_returns_generic_error(api):
    client, _ = api
    res = await client.post("/api/auth/login", json={"identifier": _email("nobody"), "password": PASSWORD})
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


async def test_forgot_password_unknown_email_is_generic(api):
    client, mail = api
    res = await client.post("/api/auth/forgot-password", json={"email": _email("nobody")})
    assert res.status_code == 200
    assert mail.sent == []


async def test_console_email_logs_code_only_in_development(monkeypatch, caplog):
    service = ConsoleEmailService()

    monkeypatch.setattr(settings, "APP_ENV", "development")
    with caplog.at_level(logging.INFO, logger="salvex.email"):
        await service.send_verification_otp("dev@salvex-test.in", "123456", "Dev")
    assert "123456" in caplog.text

    caplog.clear()
    for env in ("production", "staging", "test"):
        monkeypatch.setattr(settings, "APP_ENV", env)
        with caplog.at_level(logging.INFO, logger="salvex.email"):
            await service.send_password_reset_otp("prod@salvex-test.in", "654321", "Prod")
    assert "654321" not in caplog.text
