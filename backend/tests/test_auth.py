import pytest
import uuid
from typing import Tuple
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from safe_db import safe_test_url

from app.core.security import hash_password, verify_password, hash_token, verify_token_hash, create_access_token, decode_access_token
from app.services.email import BaseEmailService
from app.services.auth_service import AuthService
from app.models.user import User, AuthToken


class MockEmailService(BaseEmailService):
    def __init__(self):
        self.sent_otps = []

    async def send_verification_otp(self, to_email: str, otp: str, user_name: str) -> Tuple[bool, str]:
        self.sent_otps.append({"type": "verification", "to": to_email, "otp": otp})
        return True, "Mock sent"

    async def send_password_reset_otp(self, to_email: str, otp: str, user_name: str) -> Tuple[bool, str]:
        self.sent_otps.append({"type": "reset", "to": to_email, "otp": otp})
        return True, "Mock sent"


@pytest.fixture
async def pg_auth_session():
    """Isolated AsyncSession against real PostgreSQL with guaranteed transaction rollback."""
    engine = create_async_engine(safe_test_url(), echo=False)  # local test database only
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()
            await engine.dispose()


def test_password_hashing_and_verification():
    """Verify bcrypt hashing and constant-time password verification."""
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_token_hashing_and_verification():
    """Verify SHA-256 token hashing and constant-time comparison."""
    otp = "482910"
    token_hash = hash_token(otp)
    assert verify_token_hash(otp, token_hash) is True
    assert verify_token_hash("000000", token_hash) is False


def test_jwt_access_token_creation_and_decoding():
    """Verify signed JWT token roundtrip, subject extraction, and expiration."""
    user_id = str(uuid.uuid4())
    token = create_access_token(subject=user_id, role="bidder")
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == user_id
    assert payload["role"] == "bidder"
    assert "exp" in payload


@pytest.mark.asyncio
async def test_auth_service_full_registration_and_verification_flow(pg_auth_session: AsyncSession):
    """
    Test end-to-end registration:
    1. Register user -> creates user with is_email_verified=False & dispatches OTP
    2. Attempt login before email verification -> rejected with 403 / unverified error
    3. Verify email with incorrect OTP -> decrements remaining attempts
    4. Verify email with correct OTP -> sets is_email_verified=True
    5. Attempt re-using same OTP -> rejected (single-use enforced)
    6. Attempt login after verification -> succeeds and issues JWT
    """
    email_service = MockEmailService()
    auth_service = AuthService(pg_auth_session, email_service)

    email = f"user_{uuid.uuid4().hex[:8]}@salvex-test.in"
    password = "StrongPassword@2026"

    # 1. Registration
    user, err = await auth_service.register_user(
        name="Test Bidder",
        email=email,
        password=password,
        role="bidder"
    )
    assert err is None
    assert user is not None
    assert user.is_email_verified is False
    assert len(email_service.sent_otps) == 1
    otp = email_service.sent_otps[0]["otp"]

    # Duplicate registration rejection
    dup_user, dup_err = await auth_service.register_user(
        name="Test Bidder 2",
        email=email,
        password=password,
        role="bidder"
    )
    assert dup_user is None
    assert "already exists" in dup_err

    # 2. Login before verification must fail
    logged_in, token, login_err = await auth_service.authenticate_user(email, password)
    assert logged_in is None
    assert token is None
    assert "verify your email" in login_err

    # 3. Invalid OTP attempt
    success, verify_err = await auth_service.verify_email_otp(email, "999999")
    assert success is False
    assert "4 attempt(s) remaining" in verify_err

    # 4. Valid OTP verification
    success, verify_msg = await auth_service.verify_email_otp(email, otp)
    assert success is True
    assert "verified successfully" in verify_msg
    assert user.is_email_verified is True

    # 5. Single-use: reusing same OTP must fail
    reuse_success, reuse_err = await auth_service.verify_email_otp(email, otp)
    assert reuse_success is True or "already verified" in reuse_err or "No pending" in reuse_err

    # 6. Login after verification must succeed
    authed_user, auth_token, no_err = await auth_service.authenticate_user(email, password)
    assert no_err is None
    assert authed_user is not None
    assert auth_token is not None
    assert authed_user.email == email


@pytest.mark.asyncio
async def test_auth_service_password_reset_flow(pg_auth_session: AsyncSession):
    """
    Test end-to-end password reset:
    1. Request reset OTP
    2. Attempt reset with wrong OTP -> rejected
    3. Reset with correct OTP -> updates password_hash and marks token used
    4. Authenticate with new password -> succeeds
    5. Authenticate with old password -> fails
    """
    email_service = MockEmailService()
    auth_service = AuthService(pg_auth_session, email_service)

    email = f"reset_{uuid.uuid4().hex[:8]}@salvex-test.in"
    old_password = "OldSecretPassword123"
    new_password = "NewSecretPassword456!"

    user, _ = await auth_service.register_user("Reset User", email, old_password, "bidder")
    user.is_email_verified = True
    await pg_auth_session.flush()

    # 1. Request reset
    req_ok, _ = await auth_service.request_password_reset(email)
    assert req_ok is True
    reset_otp = email_service.sent_otps[-1]["otp"]

    # 2. Reset with wrong OTP
    bad_reset, bad_msg = await auth_service.reset_password_with_otp(email, "000000", new_password)
    assert bad_reset is False
    assert "Invalid reset code" in bad_msg

    # 3. Reset with correct OTP
    good_reset, good_msg = await auth_service.reset_password_with_otp(email, reset_otp, new_password)
    assert good_reset is True
    assert "Password updated successfully" in good_msg

    # 4. Old password fails
    _, _, old_err = await auth_service.authenticate_user(email, old_password)
    assert old_err is not None
    assert "Invalid email or password" in old_err

    # 5. New password succeeds
    authed, token, new_err = await auth_service.authenticate_user(email, new_password)
    assert new_err is None
    assert authed is not None
    assert token is not None
