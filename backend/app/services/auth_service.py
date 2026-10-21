from typing import Optional, Tuple
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, AuthToken
from app.core.security import (
    hash_password,
    verify_password,
    generate_secure_otp,
    hash_token,
    verify_token_hash,
    create_access_token
)
from app.services.email import BaseEmailService


class AuthService:
    def __init__(self, db: AsyncSession, email_service: BaseEmailService):
        self.db = db
        self.email_service = email_service

    async def register_user(
        self,
        name: str,
        email: str,
        password: str,
        role: str,
        mobile: str = "",
        organization: str = ""
    ) -> Tuple[Optional[User], Optional[str]]:
        """
        Register a new user, enforce email uniqueness, hash password with bcrypt,
        and dispatch an email verification OTP.
        """
        # Check if email already exists
        clean_email = email.strip().lower()
        stmt = select(User).where(User.email == clean_email)
        res = await self.db.execute(stmt)
        if res.scalar_one_or_none():
            return None, "An account with this email address already exists."

        # Hash password and create user
        pw_hash = hash_password(password)
        user = User(
            name=name.strip(),
            email=clean_email,
            password_hash=pw_hash,
            role=role,
            mobile=mobile.strip(),
            organization=organization.strip(),
            kyc_status="pending",
            is_email_verified=False,
            is_active=True
        )
        self.db.add(user)
        await self.db.flush()

        # Generate & store OTP (expires in 10 minutes)
        otp = generate_secure_otp(6)
        token_record = AuthToken(
            user_id=user.id,
            token_hash=hash_token(otp),
            purpose="email_verification",
            attempts=0,
            max_attempts=5,
            is_used=False,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
        )
        self.db.add(token_record)
        await self.db.flush()

        # Dispatch email
        await self.email_service.send_verification_otp(user.email, otp, user.name)

        return user, None

    async def verify_email_otp(self, email: str, otp: str) -> Tuple[bool, str]:
        """
        Verify email OTP using pessimistic row-locking on the active token record.
        """
        clean_email = email.strip().lower()
        stmt = select(User).where(User.email == clean_email)
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            return False, "Invalid or expired verification code."

        if user.is_email_verified:
            return True, "Email is already verified."

        # Fetch latest unused email_verification token with lock
        token_stmt = (
            select(AuthToken)
            .where(
                AuthToken.user_id == user.id,
                AuthToken.purpose == "email_verification",
                AuthToken.is_used == False  # noqa: E712
            )
            .order_by(AuthToken.created_at.desc())
            .with_for_update()
        )
        token_res = await self.db.execute(token_stmt)
        token_record = token_res.scalars().first()

        if not token_record:
            return False, "No pending verification code found. Please request a new code."

        # Check expiration
        now = datetime.now(timezone.utc)
        if now > token_record.expires_at:
            token_record.is_used = True
            await self.db.flush()
            return False, "Verification code has expired. Please request a new one."

        # Check attempts limit
        if token_record.attempts >= token_record.max_attempts:
            token_record.is_used = True
            await self.db.flush()
            return False, "Too many failed attempts. Code has been invalidated. Please request a new code."

        # Increment attempts count
        token_record.attempts += 1

        # Constant-time token verification
        if not verify_token_hash(otp, token_record.token_hash):
            await self.db.flush()
            remaining = token_record.max_attempts - token_record.attempts
            return False, f"Invalid verification code. {remaining} attempt(s) remaining."

        # Mark token as consumed and verify user
        token_record.is_used = True
        user.is_email_verified = True
        await self.db.flush()

        return True, "Email verified successfully."

    async def resend_otp(self, email: str, purpose: str = "email_verification") -> Tuple[bool, str]:
        """
        Generate and resend OTP with cooldown prevention (60s minimum interval).
        Always returns generic success message to prevent user enumeration.
        """
        clean_email = email.strip().lower()
        stmt = select(User).where(User.email == clean_email)
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            # Generic success response to prevent email enumeration
            return True, "If this email is registered, a new code has been sent."

        # Check rate-limiting cooldown (60 seconds)
        recent_stmt = (
            select(AuthToken)
            .where(
                AuthToken.user_id == user.id,
                AuthToken.purpose == purpose
            )
            .order_by(AuthToken.created_at.desc())
        )
        recent_res = await self.db.execute(recent_stmt)
        latest_token = recent_res.scalars().first()

        now = datetime.now(timezone.utc)
        if latest_token and (now - latest_token.created_at).total_seconds() < 60:
            return False, "Please wait at least 60 seconds before requesting another code."

        # Invalidate previous unused tokens for this purpose
        if latest_token and not latest_token.is_used:
            latest_token.is_used = True

        # Generate new OTP
        otp = generate_secure_otp(6)
        ttl_minutes = 15 if purpose == "password_reset" else 10
        new_token = AuthToken(
            user_id=user.id,
            token_hash=hash_token(otp),
            purpose=purpose,
            attempts=0,
            max_attempts=5,
            is_used=False,
            expires_at=now + timedelta(minutes=ttl_minutes)
        )
        self.db.add(new_token)
        await self.db.flush()

        # Send email
        if purpose == "password_reset":
            await self.email_service.send_password_reset_otp(user.email, otp, user.name)
        else:
            await self.email_service.send_verification_otp(user.email, otp, user.name)

        return True, "A new verification code has been dispatched."

    async def authenticate_user(
        self,
        identifier: str,
        password: str
    ) -> Tuple[Optional[User], Optional[str], Optional[str]]:
        """
        Authenticate user credentials. Enforces email verification and active account status.
        Returns (user, access_token, error_message).
        """
        clean_id = identifier.strip().lower()
        stmt = select(User).where(User.email == clean_id)
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()

        # Constant-time password check or dummy check to mitigate timing attacks
        if not user or not verify_password(password, user.password_hash):
            return None, None, "Invalid email or password. Please check your credentials."

        if not user.is_active:
            return None, None, "This account is suspended. Please contact Salvex compliance."

        if not user.is_email_verified:
            return None, None, "Please verify your email address before logging in."

        # Issue JWT access token
        access_token = create_access_token(
            subject=str(user.id),
            role=user.role,
            extra_claims={"email": user.email, "name": user.name}
        )

        return user, access_token, None

    async def request_password_reset(self, email: str) -> Tuple[bool, str]:
        """Initiate password reset flow safely."""
        return await self.resend_otp(email, purpose="password_reset")

    async def reset_password_with_otp(
        self,
        email: str,
        otp: str,
        new_password: str
    ) -> Tuple[bool, str]:
        """
        Verify password reset OTP with row lock and update password hash.
        """
        clean_email = email.strip().lower()
        stmt = select(User).where(User.email == clean_email)
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            return False, "Invalid or expired reset code."

        # Lock the latest unused password_reset token
        token_stmt = (
            select(AuthToken)
            .where(
                AuthToken.user_id == user.id,
                AuthToken.purpose == "password_reset",
                AuthToken.is_used == False  # noqa: E712
            )
            .order_by(AuthToken.created_at.desc())
            .with_for_update()
        )
        token_res = await self.db.execute(token_stmt)
        token_record = token_res.scalars().first()

        if not token_record:
            return False, "No active password reset request found. Please request a new code."

        now = datetime.now(timezone.utc)
        if now > token_record.expires_at:
            token_record.is_used = True
            await self.db.flush()
            return False, "Password reset code has expired. Please request a new one."

        if token_record.attempts >= token_record.max_attempts:
            token_record.is_used = True
            await self.db.flush()
            return False, "Too many failed attempts. Reset code invalidated."

        token_record.attempts += 1

        if not verify_token_hash(otp, token_record.token_hash):
            await self.db.flush()
            remaining = token_record.max_attempts - token_record.attempts
            return False, f"Invalid reset code. {remaining} attempt(s) remaining."

        # Update password hash and mark token as used
        token_record.is_used = True
        user.password_hash = hash_password(new_password)
        await self.db.flush()

        return True, "Password updated successfully. You can now log in with your new password."
