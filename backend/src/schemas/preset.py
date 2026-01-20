"""Preset schemas."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class PresetCategory(str, Enum):
    """Preset category enumeration."""

    BACKGROUND_REPLACE = "background_replace"
    OBJECT_REMOVE = "object_remove"
    OBJECT_ADD = "object_add"
    STYLE_TRANSFER = "style_transfer"
    RESTORATION = "restoration"
    CUSTOM = "custom"


class PresetBase(BaseModel):
    """Base preset schema."""

    name: str = Field(..., min_length=1, max_length=100)
    name_ko: str | None = Field(None, max_length=100)
    description: str | None = None
    description_ko: str | None = None
    category: PresetCategory = PresetCategory.CUSTOM
    default_prompt: str | None = None
    default_negative_prompt: str | None = None
    recommended_steps: int = Field(30, ge=10, le=50)
    recommended_strength: float | None = Field(None, ge=0.0, le=1.0)
    icon: str | None = Field(None, max_length=50)
    thumbnail_url: str | None = Field(None, max_length=500)
    sort_order: int = 0


class CreatePresetRequest(PresetBase):
    """Request schema for creating a preset."""

    pass


class UpdatePresetRequest(BaseModel):
    """Request schema for updating a preset."""

    name: str | None = Field(None, min_length=1, max_length=100)
    name_ko: str | None = Field(None, max_length=100)
    description: str | None = None
    description_ko: str | None = None
    category: PresetCategory | None = None
    default_prompt: str | None = None
    default_negative_prompt: str | None = None
    recommended_steps: int | None = Field(None, ge=10, le=50)
    recommended_strength: float | None = Field(None, ge=0.0, le=1.0)
    icon: str | None = Field(None, max_length=50)
    thumbnail_url: str | None = Field(None, max_length=500)
    is_active: bool | None = None
    sort_order: int | None = None


class PresetResponse(BaseModel):
    """Response schema for a preset."""

    id: str
    name: str
    name_ko: str | None
    description: str | None
    description_ko: str | None
    category: PresetCategory
    default_prompt: str | None
    default_negative_prompt: str | None
    recommended_steps: int
    recommended_strength: float | None
    icon: str | None
    thumbnail_url: str | None
    is_system: bool
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PresetListResponse(BaseModel):
    """Response schema for preset list."""

    items: list[PresetResponse]
    total: int
