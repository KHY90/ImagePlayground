"""Presets API routes."""

import logging

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from src.api.deps import DbSession
from src.models.preset import Preset
from src.schemas.preset import (
    PresetCategory,
    PresetListResponse,
    PresetResponse,
)

router = APIRouter(prefix="/presets", tags=["Presets"])
logger = logging.getLogger(__name__)


@router.get(
    "",
    response_model=PresetListResponse,
    summary="Get all active presets",
)
async def get_presets(
    db: DbSession,
    category: PresetCategory | None = None,
) -> PresetListResponse:
    """Get all active presets, optionally filtered by category."""
    query = select(Preset).where(Preset.is_active == True)

    if category:
        query = query.where(Preset.category == category.value)

    query = query.order_by(Preset.sort_order, Preset.name)

    result = await db.execute(query)
    presets = list(result.scalars().all())

    return PresetListResponse(
        items=[PresetResponse.model_validate(p) for p in presets],
        total=len(presets),
    )


@router.get(
    "/{preset_id}",
    response_model=PresetResponse,
    summary="Get preset details",
)
async def get_preset(
    preset_id: str,
    db: DbSession,
) -> PresetResponse:
    """Get details of a specific preset."""
    result = await db.execute(
        select(Preset).where(Preset.id == preset_id, Preset.is_active == True)
    )
    preset = result.scalar_one_or_none()

    if not preset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preset not found",
        )

    return PresetResponse.model_validate(preset)
