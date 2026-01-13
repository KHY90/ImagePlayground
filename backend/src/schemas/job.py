"""Job schemas."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    """Job status enumeration."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobType(str, Enum):
    """Job type enumeration."""

    TEXT2IMG = "text2img"
    IMG2IMG = "img2img"
    INPAINT = "inpaint"


class JobParameters(BaseModel):
    """Parameters for image generation."""

    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str | None = Field(None, max_length=2000)
    aspect_ratio: str = Field("1:1", pattern=r"^\d+:\d+$")
    seed: int | None = Field(None, ge=0, le=2147483647)
    steps: int = Field(30, ge=10, le=50)
    strength: float | None = Field(None, ge=0.0, le=1.0)  # for img2img


class CreateJobRequest(BaseModel):
    """Request schema for creating a job."""

    type: JobType = JobType.TEXT2IMG
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str | None = Field(None, max_length=2000)
    aspect_ratio: str = Field("1:1", pattern=r"^\d+:\d+$")
    seed: int | None = Field(None, ge=0, le=2147483647)
    steps: int = Field(30, ge=10, le=50)
    strength: float | None = Field(None, ge=0.0, le=1.0)
    source_image_id: str | None = None
    mask_data: str | None = None  # base64 encoded mask for inpaint


class JobResponse(BaseModel):
    """Response schema for a job."""

    id: str
    user_id: str
    type: JobType
    status: JobStatus
    prompt: str
    negative_prompt: str | None
    aspect_ratio: str
    seed: int | None
    steps: int
    strength: float | None
    source_image_id: str | None
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    result_image_id: str | None = None

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    """Response schema for job list."""

    items: list[JobResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
