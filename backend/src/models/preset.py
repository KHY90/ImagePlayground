"""Preset database model for inpainting templates."""

from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base


class PresetCategory(str, Enum):
    """Preset category enumeration."""

    BACKGROUND_REPLACE = "background_replace"
    OBJECT_REMOVE = "object_remove"
    OBJECT_ADD = "object_add"
    STYLE_TRANSFER = "style_transfer"
    RESTORATION = "restoration"
    CUSTOM = "custom"


class Preset(Base):
    """Preset model for inpainting templates."""

    __tablename__ = "presets"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    name_ko: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_ko: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=PresetCategory.CUSTOM.value,
    )

    # Default prompts for this preset
    default_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    default_negative_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Recommended parameters
    recommended_steps: Mapped[int] = mapped_column(default=30)
    recommended_strength: Mapped[float | None] = mapped_column(nullable=True)

    # Icon/thumbnail for UI
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # System preset vs user-created
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Sort order for display
    sort_order: Mapped[int] = mapped_column(default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Preset(id={self.id}, name={self.name}, category={self.category})>"
