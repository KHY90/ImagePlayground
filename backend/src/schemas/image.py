"""Image schemas."""

from datetime import datetime

from pydantic import BaseModel


class ImageResponse(BaseModel):
    """Response schema for a generated image."""

    id: str
    user_id: str
    job_id: str
    file_path: str
    thumbnail_path: str | None
    width: int
    height: int
    file_size: int
    mime_type: str
    prompt: str
    negative_prompt: str | None
    created_at: datetime
    expires_at: datetime

    model_config = {"from_attributes": True}


class ImageListResponse(BaseModel):
    """Response schema for image list (gallery)."""

    items: list[ImageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ImageDownloadResponse(BaseModel):
    """Response schema for image download info."""

    id: str
    filename: str
    mime_type: str
    file_size: int
