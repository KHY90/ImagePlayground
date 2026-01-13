"""Images API routes."""

from math import ceil
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse

from src.api.deps import CurrentUser, DbSession
from src.schemas.image import ImageDownloadResponse, ImageListResponse, ImageResponse
from src.services.image_service import get_image_service
from sqlalchemy import func, select
from src.models.image import GeneratedImage

router = APIRouter(prefix="/images", tags=["Images"])


@router.get(
    "",
    response_model=ImageListResponse,
    summary="Get gallery of generated images",
)
async def get_images(
    current_user: CurrentUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> ImageListResponse:
    """Get paginated list of user's generated images."""
    query = select(GeneratedImage).where(GeneratedImage.user_id == current_user.id)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated results
    query = query.order_by(GeneratedImage.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    images = list(result.scalars().all())

    return ImageListResponse(
        items=[ImageResponse.model_validate(img) for img in images],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.get(
    "/{image_id}",
    response_model=ImageResponse,
    summary="Get image details",
)
async def get_image(
    image_id: str,
    current_user: CurrentUser,
    db: DbSession,
) -> ImageResponse:
    """Get details of a specific image."""
    result = await db.execute(
        select(GeneratedImage).where(
            GeneratedImage.id == image_id,
            GeneratedImage.user_id == current_user.id,
        )
    )
    image = result.scalar_one_or_none()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    return ImageResponse.model_validate(image)


@router.get(
    "/{image_id}/download",
    summary="Download image file",
)
async def download_image(
    image_id: str,
    current_user: CurrentUser,
    db: DbSession,
):
    """Download the image file."""
    result = await db.execute(
        select(GeneratedImage).where(
            GeneratedImage.id == image_id,
            GeneratedImage.user_id == current_user.id,
        )
    )
    image = result.scalar_one_or_none()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    file_path = Path(image.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file not found",
        )

    return FileResponse(
        path=file_path,
        media_type=image.mime_type,
        filename=f"imageplayground_{image_id}.png",
    )


@router.get(
    "/{image_id}/thumbnail",
    summary="Get image thumbnail",
)
async def get_thumbnail(
    image_id: str,
    current_user: CurrentUser,
    db: DbSession,
):
    """Get the thumbnail for an image."""
    result = await db.execute(
        select(GeneratedImage).where(
            GeneratedImage.id == image_id,
            GeneratedImage.user_id == current_user.id,
        )
    )
    image = result.scalar_one_or_none()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    thumb_path = Path(image.thumbnail_path) if image.thumbnail_path else None
    if not thumb_path or not thumb_path.exists():
        # Fall back to main image
        thumb_path = Path(image.file_path)

    if not thumb_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thumbnail not found",
        )

    return FileResponse(
        path=thumb_path,
        media_type="image/png",
    )
