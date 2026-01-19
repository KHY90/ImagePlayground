"""Images API routes."""

import logging
from io import BytesIO
from math import ceil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from PIL import Image

from src.api.deps import CurrentUser, DbSession
from src.core.config import get_settings
from src.schemas.image import (
    ImageDownloadResponse,
    ImageListResponse,
    ImageResponse,
    ImageUploadResponse,
)
from src.services.image_service import get_image_service
from sqlalchemy import func, select
from src.models.image import GeneratedImage

router = APIRouter(prefix="/images", tags=["Images"])
logger = logging.getLogger(__name__)
settings = get_settings()

# Allowed image types
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post(
    "/upload",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload an image for img2img or inpainting",
)
async def upload_image(
    file: UploadFile = File(...),
    current_user: CurrentUser = None,
) -> ImageUploadResponse:
    """
    Upload an image to use as source for img2img or inpainting.

    Returns the image ID to use as source_image_id in job creation.
    """
    # Validate content type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB",
        )

    # Validate image
    try:
        image = Image.open(BytesIO(content))
        image.verify()  # Verify it's a valid image
        # Re-open for actual use (verify() can only be called once)
        image = Image.open(BytesIO(content))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted image file",
        )

    # Generate unique ID
    image_id = str(uuid4())

    # Create user upload directory
    upload_dir = Path(settings.upload_dir) / current_user.id
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Save the image as PNG
    file_path = upload_dir / f"{image_id}.png"

    # Convert to RGB if needed (handle RGBA, P mode, etc.)
    if image.mode in ("RGBA", "P", "LA"):
        # Create white background for transparency
        background = Image.new("RGB", image.size, (255, 255, 255))
        if image.mode == "P":
            image = image.convert("RGBA")
        background.paste(image, mask=image.split()[-1] if "A" in image.mode else None)
        image = background
    elif image.mode != "RGB":
        image = image.convert("RGB")

    image.save(file_path, format="PNG", optimize=True)
    file_size = file_path.stat().st_size

    logger.info(f"User {current_user.id} uploaded image {image_id} ({image.width}x{image.height})")

    return ImageUploadResponse(
        id=image_id,
        width=image.width,
        height=image.height,
        file_size=file_size,
        mime_type="image/png",
    )


@router.get(
    "/upload/{image_id}",
    summary="Get uploaded image",
)
async def get_uploaded_image(
    image_id: str,
    current_user: CurrentUser,
):
    """Get an uploaded image by ID."""
    upload_dir = Path(settings.upload_dir) / current_user.id
    file_path = upload_dir / f"{image_id}.png"

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded image not found",
        )

    return FileResponse(
        path=file_path,
        media_type="image/png",
    )


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
