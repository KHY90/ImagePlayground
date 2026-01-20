"""Job database model."""

from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


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


class Job(Base):
    """Job model for tracking image generation tasks."""

    __tablename__ = "jobs"
    __table_args__ = (
        Index("ix_jobs_user_status", "user_id", "status"),
        Index("ix_jobs_created_at", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=JobType.TEXT2IMG.value,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=JobStatus.PENDING.value,
        index=True,
    )

    # Generation parameters (stored as JSON string)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    negative_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    aspect_ratio: Mapped[str] = mapped_column(String(20), default="1:1")
    seed: Mapped[int | None] = mapped_column(nullable=True)
    steps: Mapped[int] = mapped_column(default=30)
    strength: Mapped[float | None] = mapped_column(nullable=True)  # for img2img

    # Model selection
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Source image for img2img/inpaint
    source_image_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    mask_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # base64 for inpaint

    # Result
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="jobs")
    generated_images: Mapped[list["GeneratedImage"]] = relationship(
        "GeneratedImage",
        back_populates="job",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Job(id={self.id}, type={self.type}, status={self.status})>"
