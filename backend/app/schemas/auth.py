import uuid
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict


class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name or company name")
    email: EmailStr = Field(..., description="Unique user email address")
    password: str = Field(..., min_length=8, max_length=128, description="Account password (min 8 characters)")
    role: Literal["bidder", "seller"] = Field(default="bidder", description="User role")
    mobile: Optional[str] = Field(default="", max_length=50, description="Contact mobile number")
    organization: Optional[str] = Field(default="", max_length=255, description="Registered organization")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 2:
            raise ValueError("Name must be at least 2 characters")
        return clean

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class UserLoginRequest(BaseModel):
    identifier: str = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, max_length=128, description="Account password")


class VerifyEmailRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification OTP")


class ResendOtpRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    purpose: Literal["email_verification", "password_reset"] = Field(
        default="email_verification",
        description="Purpose of OTP"
    )


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered account email")


class ResetPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered account email")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit password reset OTP")
    new_password: str = Field(..., min_length=8, max_length=128, description="New account password")


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    mobile: str
    organization: str
    kyc_status: str
    is_email_verified: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class AuthTokenResponse(BaseModel):
    message: str
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GenericMessageResponse(BaseModel):
    message: str
    success: bool = True
