"""API routes for model management."""

from fastapi import APIRouter
from pydantic import BaseModel

from src.services.local_inference import get_local_client

router = APIRouter(prefix="/models", tags=["Models"])


class ModelInfo(BaseModel):
    """Model information response schema."""

    id: str
    name: str
    description: str
    capabilities: list[str]
    vram_requirement: str
    base_resolution: int


class ModelListResponse(BaseModel):
    """Response schema for model list."""

    items: list[ModelInfo]
    default_model: str


class DeviceInfo(BaseModel):
    """Device information response schema."""

    device: str
    cuda_available: bool
    gpu_name: str | None = None
    gpu_memory_total: int | None = None
    gpu_memory_allocated: int | None = None
    gpu_memory_cached: int | None = None


@router.get("", response_model=ModelListResponse)
async def get_models() -> ModelListResponse:
    """
    Get list of available models.

    Returns a list of all available models with their capabilities.
    """
    client = get_local_client()
    models = client.get_available_models()

    return ModelListResponse(
        items=[
            ModelInfo(
                id=m["id"],
                name=m["name"],
                description=m["description"],
                capabilities=m["capabilities"],
                vram_requirement=m.get("vram_requirement", "unknown"),
                base_resolution=m.get("base_resolution", 1024),
            )
            for m in models
        ],
        default_model="runwayml/stable-diffusion-v1-5",
    )


@router.get("/device", response_model=DeviceInfo)
async def get_device_info() -> DeviceInfo:
    """
    Get device information.

    Returns information about the current inference device (GPU/CPU).
    """
    client = get_local_client()
    info = client.get_device_info()

    return DeviceInfo(
        device=info["device"],
        cuda_available=info["cuda_available"],
        gpu_name=info.get("gpu_name"),
        gpu_memory_total=info.get("gpu_memory_total"),
        gpu_memory_allocated=info.get("gpu_memory_allocated"),
        gpu_memory_cached=info.get("gpu_memory_cached"),
    )
