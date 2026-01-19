"""API dependencies."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db



# Default local user for development (no authentication required)
DEFAULT_USER_ID = "local-user-001"
DEFAULT_USER_EMAIL = "local@localhost"
DEFAULT_USER_NAME = "LocalUser"


class LocalUser:
    """Simple user object for local development without authentication."""

    def __init__(self):
        self.id = DEFAULT_USER_ID
        self.email = DEFAULT_USER_EMAIL
        self.username = DEFAULT_USER_NAME
        self.is_active = True
        self.is_admin = True  # Admin access for local development


async def get_current_user() -> LocalUser:
    """Return a local user without authentication."""
    return LocalUser()


async def get_current_admin_user() -> LocalUser:
    """Return a local admin user without authentication."""
    return LocalUser()


# Type aliases for cleaner dependency injection
CurrentUser = Annotated[LocalUser, Depends(get_current_user)]
AdminUser = Annotated[LocalUser, Depends(get_current_admin_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
