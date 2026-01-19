"""Job processing service."""

import logging
from datetime import date, datetime, timezone
from pathlib import Path

from PIL import Image
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.models.daily_usage import DailyUsage
from src.models.image import GeneratedImage
from src.models.job import Job, JobStatus, JobType
from src.schemas.job import CreateJobRequest, JobResponse
from src.services.hf_client import get_hf_client, ASPECT_RATIOS
from src.services.image_service import get_image_service

settings = get_settings()
logger = logging.getLogger(__name__)


class JobService:
    """Service for managing image generation jobs."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.hf_client = get_hf_client()
        self.image_service = get_image_service()

    async def get_daily_usage(self, user_id: str) -> int:
        """Get user's generation count for today."""
        today = date.today()
        result = await self.db.execute(
            select(DailyUsage).where(
                DailyUsage.user_id == user_id,
                DailyUsage.usage_date == today,
            )
        )
        usage = result.scalar_one_or_none()
        return usage.generation_count if usage else 0

    async def increment_daily_usage(self, user_id: str) -> int:
        """Increment user's daily usage count."""
        today = date.today()
        result = await self.db.execute(
            select(DailyUsage).where(
                DailyUsage.user_id == user_id,
                DailyUsage.usage_date == today,
            )
        )
        usage = result.scalar_one_or_none()

        if usage:
            usage.generation_count += 1
        else:
            usage = DailyUsage(
                user_id=user_id,
                usage_date=today,
                generation_count=1,
            )
            self.db.add(usage)

        await self.db.flush()
        return usage.generation_count

    async def check_usage_limit(self, user_id: str) -> bool:
        """Check if user has exceeded daily limit."""
        current_usage = await self.get_daily_usage(user_id)
        return current_usage < settings.daily_generation_limit

    async def create_job(self, user_id: str, request: CreateJobRequest) -> Job:
        """Create a new generation job."""
        job = Job(
            user_id=user_id,
            type=request.type.value,
            status=JobStatus.PENDING.value,
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            aspect_ratio=request.aspect_ratio,
            seed=request.seed,
            steps=request.steps,
            strength=request.strength,
            source_image_id=request.source_image_id,
            mask_data=request.mask_data,
        )

        self.db.add(job)
        await self.db.flush()
        await self.db.refresh(job)

        logger.info(f"Created job {job.id} for user {user_id}")
        return job

    async def get_job(self, job_id: str, user_id: str | None = None) -> Job | None:
        """Get a job by ID, optionally filtered by user."""
        query = select(Job).where(Job.id == job_id)
        if user_id:
            query = query.where(Job.user_id == user_id)

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_jobs(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        status: JobStatus | None = None,
    ) -> tuple[list[Job], int]:
        """Get paginated list of jobs for a user."""
        query = select(Job).where(Job.user_id == user_id)

        if status:
            query = query.where(Job.status == status.value)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(Job.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        jobs = list(result.scalars().all())

        return jobs, total

    async def update_job_status(
        self,
        job_id: str,
        status: JobStatus,
        error_message: str | None = None,
    ) -> Job | None:
        """Update job status."""
        job = await self.get_job(job_id)
        if not job:
            return None

        job.status = status.value

        if status == JobStatus.PROCESSING:
            job.started_at = datetime.now(timezone.utc)
        elif status in (JobStatus.COMPLETED, JobStatus.FAILED):
            job.completed_at = datetime.now(timezone.utc)

        if error_message:
            job.error_message = error_message

        await self.db.flush()
        return job

    async def process_text_to_image(self, job: Job) -> GeneratedImage | None:
        """Process a text-to-image job."""
        try:
            # Update status to processing
            await self.update_job_status(job.id, JobStatus.PROCESSING)
            await self.db.commit()

            # Generate image
            image = await self.hf_client.text_to_image(
                prompt=job.prompt,
                negative_prompt=job.negative_prompt,
                aspect_ratio=job.aspect_ratio,
                seed=job.seed,
                num_inference_steps=job.steps,
            )

            # Save image
            image_data = await self.image_service.save_generated_image(
                image=image,
                user_id=job.user_id,
                job_id=job.id,
                prompt=job.prompt,
                negative_prompt=job.negative_prompt,
                parameters={
                    "type": job.type,
                    "aspect_ratio": job.aspect_ratio,
                    "seed": job.seed,
                    "steps": job.steps,
                },
            )

            # Create database record
            generated_image = GeneratedImage(
                user_id=job.user_id,
                job_id=job.id,
                **image_data,
            )
            self.db.add(generated_image)

            # Update job status
            await self.update_job_status(job.id, JobStatus.COMPLETED)

            # Increment usage
            await self.increment_daily_usage(job.user_id)

            await self.db.commit()
            await self.db.refresh(generated_image)

            logger.info(f"Job {job.id} completed successfully")
            return generated_image

        except Exception as e:
            logger.error(f"Job {job.id} failed: {e}")
            await self.update_job_status(job.id, JobStatus.FAILED, str(e))
            await self.db.commit()
            return None

    async def process_image_to_image(self, job: Job) -> GeneratedImage | None:
        """Process an image-to-image job."""
        try:
            # Update status to processing
            await self.update_job_status(job.id, JobStatus.PROCESSING)
            await self.db.commit()

            # Load source image
            if not job.source_image_id:
                raise ValueError("source_image_id is required for img2img")

            source_path = Path(settings.upload_dir) / job.user_id / f"{job.source_image_id}.png"
            if not source_path.exists():
                raise ValueError(f"Source image not found: {job.source_image_id}")

            source_image = Image.open(source_path)

            # Resize source image to target aspect ratio if specified
            target_width, target_height = ASPECT_RATIOS.get(job.aspect_ratio, (1024, 1024))
            source_image = await self.image_service.resize_image(
                source_image,
                target_width,
                target_height,
                mode="crop",
            )

            # Transform image
            result_image = await self.hf_client.image_to_image(
                image=source_image,
                prompt=job.prompt,
                negative_prompt=job.negative_prompt,
                strength=job.strength or 0.8,
                seed=job.seed,
                num_inference_steps=job.steps,
            )

            # Save result image
            image_data = await self.image_service.save_generated_image(
                image=result_image,
                user_id=job.user_id,
                job_id=job.id,
                prompt=job.prompt,
                negative_prompt=job.negative_prompt,
                parameters={
                    "type": job.type,
                    "aspect_ratio": job.aspect_ratio,
                    "seed": job.seed,
                    "steps": job.steps,
                    "strength": job.strength,
                    "source_image_id": job.source_image_id,
                },
            )

            # Create database record
            generated_image = GeneratedImage(
                user_id=job.user_id,
                job_id=job.id,
                **image_data,
            )
            self.db.add(generated_image)

            # Update job status
            await self.update_job_status(job.id, JobStatus.COMPLETED)

            # Increment usage
            await self.increment_daily_usage(job.user_id)

            await self.db.commit()
            await self.db.refresh(generated_image)

            logger.info(f"Img2img job {job.id} completed successfully")
            return generated_image

        except Exception as e:
            logger.error(f"Img2img job {job.id} failed: {e}")
            await self.update_job_status(job.id, JobStatus.FAILED, str(e))
            await self.db.commit()
            return None

    async def get_job_result_image(self, job_id: str) -> GeneratedImage | None:
        """Get the result image for a completed job."""
        result = await self.db.execute(
            select(GeneratedImage).where(GeneratedImage.job_id == job_id)
        )
        return result.scalar_one_or_none()

    def to_response(self, job: Job, result_image_id: str | None = None) -> JobResponse:
        """Convert Job model to response schema."""
        return JobResponse(
            id=job.id,
            user_id=job.user_id,
            type=JobType(job.type),
            status=JobStatus(job.status),
            prompt=job.prompt,
            negative_prompt=job.negative_prompt,
            aspect_ratio=job.aspect_ratio,
            seed=job.seed,
            steps=job.steps,
            strength=job.strength,
            source_image_id=job.source_image_id,
            error_message=job.error_message,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
            result_image_id=result_image_id,
        )
