import uuid
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User
from app.core.security import decode_access_token

http_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    request: Request,
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Extract token from Authorization header or HttpOnly 'access_token' cookie.
    Returns User if valid, or None.
    """
    token: Optional[str] = None

    if auth_header and auth_header.credentials:
        token = auth_header.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    try:
        user_id = uuid.UUID(payload["sub"])
    except (ValueError, TypeError):
        return None

    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.is_active:
        return None

    return user


async def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    """Require valid authenticated user."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to access this resource.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(allowed_roles: List[str]):
    """Role-based authorization dependency factory."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
