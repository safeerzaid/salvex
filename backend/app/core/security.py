import secrets
import hashlib
import hmac
from datetime import datetime, timezone, timedelta
from typing import Optional, Any, Dict
import bcrypt
import jwt
from app.core.config import settings


def hash_password(password: str) -> str:
    """Hash password using direct bcrypt with 12 rounds."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash in constant time."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def generate_secure_otp(length: int = 6) -> str:
    """Generate a cryptographically secure numeric OTP."""
    digits = [str(secrets.randbelow(10)) for _ in range(length)]
    return "".join(digits)


def hash_token(token: str) -> str:
    """Compute SHA-256 hash of plaintext OTP or reset token before storing in DB."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_token_hash(plain_token: str, stored_hash: str) -> bool:
    """Compare hash of plaintext token against stored hash in constant time."""
    computed_hash = hash_token(plain_token)
    return hmac.compare_digest(computed_hash, stored_hash)


def create_access_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None
) -> str:
    """
    Generate signed JWT access token with user ID and role.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "role": str(role),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)

    token = jwt.encode(payload, settings.APP_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify signed JWT access token. Returns payload or None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.APP_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.PyJWTError:
        return None
