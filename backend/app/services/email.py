import logging
import asyncio
import smtplib
from abc import ABC, abstractmethod
from typing import Tuple
from email.message import EmailMessage
from app.core.config import settings

logger = logging.getLogger("salvex.email")


class BaseEmailService(ABC):
    @abstractmethod
    async def send_verification_otp(self, to_email: str, otp: str, user_name: str) -> Tuple[bool, str]:
        pass

    @abstractmethod
    async def send_password_reset_otp(self, to_email: str, otp: str, user_name: str) -> Tuple[bool, str]:
        pass


class ConsoleEmailService(BaseEmailService):
    """
    Local transport that doesn't send real email.
    The code is written to the log only when APP_ENV is exactly "development",
    so the verification and reset flows can be completed locally.
    In any other environment the code is never logged.
    """
    @staticmethod
    def _log(kind: str, to_email: str, otp: str) -> None:
        if settings.APP_ENV == "development":
            logger.info(f"[DEV_EMAIL] {kind} code for {to_email}: {otp}")
        else:
            logger.info(f"[DEV_EMAIL] {kind} code generated for {to_email} (not logged outside development)")

    async def send_verification_otp(self, to_email: str, otp: str, user_name: str) -> Tuple[bool, str]:
        self._log("Verification", to_email, otp)
        return True, "Email dispatched via local mock"

    async def send_password_reset_otp(self, to_email: str, otp: str, user_name: str) -> Tuple[bool, str]:
        self._log("Password reset", to_email, otp)
        return True, "Email dispatched via local mock"


class SmtpEmailService(BaseEmailService):
    """
    Production SMTP transport with secure TLS, timeouts, and error handling.
    """
    async def _send(self, to_email: str, subject: str, text_content: str, html_content: str) -> Tuple[bool, str]:
        if not settings.SMTP_HOST or not settings.SMTP_USER:
            logger.warning("SMTP configuration is incomplete. Falling back to safe mock.")
            return True, "SMTP unconfigured, queued in mock mode"

        msg = EmailMessage()
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content(text_content)
        msg.add_alternative(html_content, subtype="html")

        def _sync_send():
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)

        try:
            await asyncio.to_thread(_sync_send)
            return True, "Email sent successfully"
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {type(e).__name__}")
            return False, f"Email delivery error: {type(e).__name__}"

    async def send_verification_otp(self, to_email: str, otp: str, user_name: str) -> Tuple[bool, str]:
        subject = "Verify your Salvex Auction Account"
        text_content = (
            f"Hello {user_name},\n\n"
            f"Your Salvex verification code is: {otp}\n"
            f"This code will expire in 10 minutes.\n\n"
            f"If you did not request this, please ignore this email."
        )
        html_content = f"""
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0B1220;">Salvex Auction Account Verification</h2>
            <p>Hello <strong>{user_name}</strong>,</p>
            <p>Your one-time verification passcode is:</p>
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #DC2626; border-radius: 6px;">
                {otp}
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This code is valid for 10 minutes. Never share this code with anyone.</p>
        </div>
        """
        return await self._send(to_email, subject, text_content, html_content)

    async def send_password_reset_otp(self, to_email: str, otp: str, user_name: str) -> Tuple[bool, str]:
        subject = "Reset your Salvex Auction Password"
        text_content = (
            f"Hello {user_name},\n\n"
            f"Your Salvex password reset code is: {otp}\n"
            f"This code will expire in 15 minutes.\n\n"
            f"If you did not request a password reset, please contact support immediately."
        )
        html_content = f"""
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0B1220;">Salvex Auction Password Reset</h2>
            <p>Hello <strong>{user_name}</strong>,</p>
            <p>Your password reset code is:</p>
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #DC2626; border-radius: 6px;">
                {otp}
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This code is valid for 15 minutes. If you did not request this, please disregard.</p>
        </div>
        """
        return await self._send(to_email, subject, text_content, html_content)


def get_email_service() -> BaseEmailService:
    """Factory returning configured email service implementation."""
    if settings.EMAIL_PROVIDER.lower() == "smtp" and settings.SMTP_HOST:
        return SmtpEmailService()
    return ConsoleEmailService()
