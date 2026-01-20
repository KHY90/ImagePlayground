"""Jobs API routes."""

import logging
from math import ceil

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status

from src.api.deps import CurrentUser, DbSession
from src.models.job import JobStatus
from src.schemas.job import CreateJobRequest, JobListResponse, JobResponse
from src.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["Jobs"])
logger = logging.getLogger(__name__)


async def process_job_background(job_id: str, user_id: str, db_url: str):
    """Background task to process a job."""
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

    from src.services.job_service import JobService

    engine = create_async_engine(db_url)
    async with AsyncSession(engine, expire_on_commit=False) as session:
        job_service = JobService(session)
        job = await job_service.get_job(job_id, user_id)

        if job:
            if job.type == "text2img":
                await job_service.process_text_to_image(job)
            elif job.type == "img2img":
                await job_service.process_image_to_image(job)
            elif job.type == "inpaint":
                await job_service.process_inpaint(job)

    await engine.dispose()


@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new image generation job",
)
async def create_job(
    request: CreateJobRequest,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: DbSession,
) -> JobResponse:
    """
    Create a new image generation job.

    The job will be processed asynchronously in the background.
    Poll the job status endpoint to check for completion.
    """
    job_service = JobService(db)

    try:
        job = await job_service.create_job(current_user.id, request)
        await db.commit()

        # Add background task for processing
        from src.core.config import get_settings

        settings = get_settings()
        background_tasks.add_task(
            process_job_background,
            job.id,
            current_user.id,
            settings.database_url,
        )

        logger.info(f"Job {job.id} created and queued for processing")
        return job_service.to_response(job)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )


@router.get(
    "",
    response_model=JobListResponse,
    summary="Get list of jobs",
)
async def get_jobs(
    current_user: CurrentUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: JobStatus | None = None,
) -> JobListResponse:
    """Get paginated list of user's jobs."""
    job_service = JobService(db)

    jobs, total = await job_service.get_jobs(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status=status,
    )

    # Get result images for completed jobs
    job_responses = []
    for job in jobs:
        result_image_id = None
        if job.status == JobStatus.COMPLETED.value:
            result_image = await job_service.get_job_result_image(job.id)
            if result_image:
                result_image_id = result_image.id
        job_responses.append(job_service.to_response(job, result_image_id))

    return JobListResponse(
        items=job_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Get job details",
)
async def get_job(
    job_id: str,
    current_user: CurrentUser,
    db: DbSession,
) -> JobResponse:
    """Get details of a specific job."""
    job_service = JobService(db)

    job = await job_service.get_job(job_id, current_user.id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    # Get result image if completed
    result_image_id = None
    if job.status == JobStatus.COMPLETED.value:
        result_image = await job_service.get_job_result_image(job.id)
        if result_image:
            result_image_id = result_image.id

    return job_service.to_response(job, result_image_id)
