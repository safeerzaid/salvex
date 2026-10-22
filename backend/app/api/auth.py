from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.config import settings
from app.services.email import get_email_service
from app.services.auth_service import AuthService
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    VerifyEmailRequest,
    ResendOtpRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserResponse,
    AuthTokenResponse,
    GenericMessageResponse
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Identity"])


@router.post(
    "/register",
    response_model=GenericMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new bidder or seller account"
)
async def register(
    data: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    email_service = get_email_service()
    auth_service = AuthService(db, email_service)

    user, error = await auth_service.register_user(
        name=data.name,
        email=data.email,
        password=data.password,
        role=data.role,
        mobile=data.mobile or "",
        organization=data.organization or ""
    )
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )

    await db.commit()
    return GenericMessageResponse(
        message="Registration initiated. A 6-digit verification code has been dispatched to your email."
    )


@router.post(
    "/verify-email",
    response_model=GenericMessageResponse,
    summary="Verify account email address using 6-digit OTP"
)
async def verify_email(
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    email_service = get_email_service()
    auth_service = AuthService(db, email_service)

    success, message = await auth_service.verify_email_otp(data.email, data.otp)
    # Commit even on failure so attempt counts and invalidated codes are saved.
    # Without this, the error response rolls back and the attempt limit never applies.
    await db.commit()
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    return GenericMessageResponse(message=message)


@router.post(
    "/resend-otp",
    response_model=GenericMessageResponse,
    summary="Resend verification or reset OTP code"
)
async def resend_otp(
    data: ResendOtpRequest,
    db: AsyncSession = Depends(get_db)
):
    email_service = get_email_service()
    auth_service = AuthService(db, email_service)

    success, message = await auth_service.resend_otp(data.email, data.purpose)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=message
        )

    await db.commit()
    return GenericMessageResponse(message=message)


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Authenticate and receive access token + HttpOnly session cookie"
)
async def login(
    data: UserLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    email_service = get_email_service()
    auth_service = AuthService(db, email_service)

    user, token, error = await auth_service.authenticate_user(data.identifier, data.password)
    if error:
        status_code = status.HTTP_403_FORBIDDEN if "verify your email" in error else status.HTTP_401_UNAUTHORIZED
        raise HTTPException(status_code=status_code, detail=error)

    # Set secure HttpOnly cookie for browser sessions
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    return AuthTokenResponse(
        message="Login successful",
        access_token=token,
        user=UserResponse.model_validate(user)
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get authenticated user profile"
)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    return UserResponse.model_validate(current_user)


@router.post(
    "/logout",
    response_model=GenericMessageResponse,
    summary="Clear session cookie and log out"
)
async def logout(
    response: Response
):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE
    )
    return GenericMessageResponse(message="Successfully logged out.")


@router.post(
    "/forgot-password",
    response_model=GenericMessageResponse,
    summary="Request a password reset OTP"
)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    email_service = get_email_service()
    auth_service = AuthService(db, email_service)

    _, message = await auth_service.request_password_reset(data.email)
    await db.commit()
    return GenericMessageResponse(
        message="If this email is registered, password reset instructions have been dispatched."
    )


@router.post(
    "/reset-password",
    response_model=GenericMessageResponse,
    summary="Reset password using 6-digit OTP"
)
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    email_service = get_email_service()
    auth_service = AuthService(db, email_service)

    success, message = await auth_service.reset_password_with_otp(
        email=data.email,
        otp=data.otp,
        new_password=data.new_password
    )
    # Commit even on failure so attempt counts and invalidated codes are saved.
    await db.commit()
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    return GenericMessageResponse(message=message)
