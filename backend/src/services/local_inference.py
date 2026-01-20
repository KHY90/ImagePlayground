"""Local inference client for image generation using local GPU/CPU."""

import asyncio
import logging
from io import BytesIO
from typing import Any

import torch
from PIL import Image

from src.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Model configurations
AVAILABLE_MODELS = [
    {
        "id": "runwayml/stable-diffusion-v1-5",
        "name": "SD 1.5",
        "description": "Stable Diffusion 1.5 - 가벼운 모델, 4GB VRAM으로 실행 가능",
        "pipeline_type": "StableDiffusionPipeline",
        "capabilities": ["text2img", "img2img", "inpaint"],
        "vram_requirement": "4GB",
        "base_resolution": 512,
    },
    {
        "id": "stabilityai/stable-diffusion-2-1",
        "name": "SD 2.1",
        "description": "Stable Diffusion 2.1 - 개선된 품질, 6GB VRAM 권장",
        "pipeline_type": "StableDiffusion2Pipeline",
        "capabilities": ["text2img", "img2img", "inpaint"],
        "vram_requirement": "6GB",
        "base_resolution": 768,
    },
    {
        "id": "stabilityai/stable-diffusion-xl-base-1.0",
        "name": "SDXL Base",
        "description": "Stable Diffusion XL - 고품질 이미지 생성, 8GB VRAM 권장",
        "pipeline_type": "StableDiffusionXLPipeline",
        "capabilities": ["text2img", "img2img"],
        "vram_requirement": "8GB",
        "base_resolution": 1024,
    },
    {
        "id": "black-forest-labs/FLUX.1-schnell",
        "name": "FLUX.1 Schnell",
        "description": "FLUX 빠른 모델 - 빠른 생성, 12GB VRAM 필요",
        "pipeline_type": "FluxPipeline",
        "capabilities": ["text2img"],
        "vram_requirement": "12GB",
        "base_resolution": 1024,
    },
    {
        "id": "black-forest-labs/FLUX.1-dev",
        "name": "FLUX.1 Dev",
        "description": "FLUX 개발 모델 - 최고 품질, 16GB+ VRAM 필요",
        "pipeline_type": "FluxPipeline",
        "capabilities": ["text2img"],
        "vram_requirement": "16GB+",
        "base_resolution": 1024,
    },
]

# Default model (lightweight for compatibility)
DEFAULT_MODEL_ID = "runwayml/stable-diffusion-v1-5"

# Aspect ratio to dimensions mapping (base 1024 - will be scaled per model)
ASPECT_RATIOS_1024 = {
    "1:1": (1024, 1024),
    "16:9": (1344, 768),
    "9:16": (768, 1344),
    "4:3": (1152, 896),
    "3:4": (896, 1152),
    "3:2": (1216, 832),
    "2:3": (832, 1216),
}

# Aspect ratio for 768 base (SD 2.1)
ASPECT_RATIOS_768 = {
    "1:1": (768, 768),
    "16:9": (1024, 576),
    "9:16": (576, 1024),
    "4:3": (896, 672),
    "3:4": (672, 896),
    "3:2": (912, 608),
    "2:3": (608, 912),
}

# Aspect ratio for 512 base (SD 1.5)
ASPECT_RATIOS_512 = {
    "1:1": (512, 512),
    "16:9": (680, 384),
    "9:16": (384, 680),
    "4:3": (600, 448),
    "3:4": (448, 600),
    "3:2": (608, 408),
    "2:3": (408, 608),
}


def get_dimensions_for_model(aspect_ratio: str, model_id: str | None = None) -> tuple[int, int]:
    """Get image dimensions based on aspect ratio and model.

    Args:
        aspect_ratio: Aspect ratio string (e.g., "1:1", "16:9")
        model_id: Model ID to determine base resolution

    Returns:
        Tuple of (width, height)
    """
    # Get model config to determine base resolution
    model_config = next(
        (m for m in AVAILABLE_MODELS if m["id"] == model_id),
        None
    ) if model_id else None

    base_resolution = model_config["base_resolution"] if model_config else 1024

    if base_resolution == 512:
        return ASPECT_RATIOS_512.get(aspect_ratio, (512, 512))
    elif base_resolution == 768:
        return ASPECT_RATIOS_768.get(aspect_ratio, (768, 768))
    else:
        return ASPECT_RATIOS_1024.get(aspect_ratio, (1024, 1024))


class LocalInferenceClient:
    """Client for local image generation using diffusers."""

    def __init__(self):
        """Initialize the local inference client."""
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.dtype = torch.bfloat16 if self.device == "cuda" else torch.float32
        self.pipelines: dict[str, Any] = {}

        logger.info(f"LocalInferenceClient initialized with device: {self.device}")
        if self.device == "cuda":
            logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
            logger.info(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")

    def get_available_models(self) -> list[dict]:
        """Get list of available models."""
        return AVAILABLE_MODELS

    def _get_pipeline(self, model_id: str, task: str) -> Any:
        """
        Get or load a pipeline for the specified model and task.

        Args:
            model_id: HuggingFace model ID
            task: Task type (text2img, img2img, inpaint)

        Returns:
            Pipeline instance
        """
        cache_key = f"{model_id}_{task}"

        if cache_key in self.pipelines:
            return self.pipelines[cache_key]

        logger.info(f"Loading pipeline for {model_id} ({task})")

        # Clear other pipelines to free memory
        self._clear_pipelines()

        # Get model config
        model_config = next(
            (m for m in AVAILABLE_MODELS if m["id"] == model_id),
            None
        )

        if not model_config:
            raise ValueError(f"Unknown model: {model_id}")

        pipeline_type = model_config["pipeline_type"]

        # Import and load the appropriate pipeline
        if pipeline_type == "StableDiffusionPipeline":
            pipeline = self._load_sd15_pipeline(model_id, task)
        elif pipeline_type == "StableDiffusion2Pipeline":
            pipeline = self._load_sd21_pipeline(model_id, task)
        elif pipeline_type == "StableDiffusionXLPipeline":
            pipeline = self._load_sdxl_pipeline(model_id, task)
        elif pipeline_type == "FluxPipeline":
            pipeline = self._load_flux_pipeline(model_id, task)
        else:
            raise ValueError(f"Unknown pipeline type: {pipeline_type}")

        self.pipelines[cache_key] = pipeline
        return pipeline

    def _load_sd15_pipeline(self, model_id: str, task: str) -> Any:
        """Load Stable Diffusion 1.5 pipeline."""
        from diffusers import (
            StableDiffusionPipeline,
            StableDiffusionImg2ImgPipeline,
            StableDiffusionInpaintPipeline,
        )

        # Use float16 for SD 1.5 (more compatible than bfloat16)
        dtype = torch.float16 if self.device == "cuda" else torch.float32

        common_args = {
            "torch_dtype": dtype,
            "safety_checker": None,
            "requires_safety_checker": False,
        }

        if task == "text2img":
            pipeline = StableDiffusionPipeline.from_pretrained(
                model_id,
                **common_args
            )
        elif task == "img2img":
            pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
                model_id,
                **common_args
            )
        elif task == "inpaint":
            # Use dedicated inpainting model for SD 1.5
            pipeline = StableDiffusionInpaintPipeline.from_pretrained(
                "runwayml/stable-diffusion-inpainting",
                **common_args
            )
        else:
            raise ValueError(f"Unknown task: {task}")

        # Apply optimizations
        pipeline = self._apply_optimizations(pipeline)

        return pipeline

    def _load_sd21_pipeline(self, model_id: str, task: str) -> Any:
        """Load Stable Diffusion 2.1 pipeline."""
        from diffusers import (
            StableDiffusionPipeline,
            StableDiffusionImg2ImgPipeline,
            StableDiffusionInpaintPipeline,
        )

        # Use float16 for SD 2.1
        dtype = torch.float16 if self.device == "cuda" else torch.float32

        common_args = {
            "torch_dtype": dtype,
        }

        if task == "text2img":
            pipeline = StableDiffusionPipeline.from_pretrained(
                model_id,
                **common_args
            )
        elif task == "img2img":
            pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
                model_id,
                **common_args
            )
        elif task == "inpaint":
            # Use dedicated inpainting model for SD 2.x
            pipeline = StableDiffusionInpaintPipeline.from_pretrained(
                "stabilityai/stable-diffusion-2-inpainting",
                **common_args
            )
        else:
            raise ValueError(f"Unknown task: {task}")

        # Apply optimizations
        pipeline = self._apply_optimizations(pipeline)

        return pipeline

    def _load_sdxl_pipeline(self, model_id: str, task: str) -> Any:
        """Load SDXL pipeline."""
        from diffusers import (
            StableDiffusionXLPipeline,
            StableDiffusionXLImg2ImgPipeline,
            StableDiffusionXLInpaintPipeline,
        )

        common_args = {
            "torch_dtype": self.dtype,
            "use_safetensors": True,
            "variant": "fp16" if self.dtype == torch.bfloat16 else None,
        }

        if task == "text2img":
            pipeline = StableDiffusionXLPipeline.from_pretrained(
                model_id,
                **common_args
            )
        elif task == "img2img":
            pipeline = StableDiffusionXLImg2ImgPipeline.from_pretrained(
                model_id,
                **common_args
            )
        elif task == "inpaint":
            # Use dedicated inpainting model
            pipeline = StableDiffusionXLInpaintPipeline.from_pretrained(
                "diffusers/stable-diffusion-xl-1.0-inpainting-0.1",
                **common_args
            )
        else:
            raise ValueError(f"Unknown task: {task}")

        # Apply optimizations
        pipeline = self._apply_optimizations(pipeline)

        return pipeline

    def _load_flux_pipeline(self, model_id: str, task: str) -> Any:
        """Load FLUX pipeline."""
        from diffusers import FluxPipeline

        if task != "text2img":
            raise ValueError(f"FLUX models only support text2img, not {task}")

        pipeline = FluxPipeline.from_pretrained(
            model_id,
            torch_dtype=self.dtype,
        )

        # Apply optimizations
        pipeline = self._apply_optimizations(pipeline)

        return pipeline

    def _apply_optimizations(self, pipeline: Any) -> Any:
        """Apply memory and performance optimizations to pipeline."""
        if self.device == "cuda":
            pipeline = pipeline.to(self.device)

            # Enable memory efficient attention if available
            try:
                pipeline.enable_xformers_memory_efficient_attention()
                logger.info("Enabled xformers memory efficient attention")
            except Exception:
                try:
                    pipeline.enable_attention_slicing()
                    logger.info("Enabled attention slicing")
                except Exception:
                    pass

            # Enable VAE slicing for lower memory usage
            try:
                pipeline.enable_vae_slicing()
            except Exception:
                pass
        else:
            # CPU optimizations
            pipeline = pipeline.to(self.device)
            try:
                pipeline.enable_attention_slicing()
            except Exception:
                pass

        return pipeline

    def _clear_pipelines(self):
        """Clear loaded pipelines to free memory."""
        for key in list(self.pipelines.keys()):
            del self.pipelines[key]

        if self.device == "cuda":
            torch.cuda.empty_cache()

        self.pipelines = {}

    def _get_dimensions(self, aspect_ratio: str, model_id: str | None = None) -> tuple[int, int]:
        """Get image dimensions from aspect ratio based on model."""
        # Get model config to determine base resolution
        model_config = next(
            (m for m in AVAILABLE_MODELS if m["id"] == model_id),
            None
        ) if model_id else None

        base_resolution = model_config["base_resolution"] if model_config else 1024

        if base_resolution == 512:
            return ASPECT_RATIOS_512.get(aspect_ratio, (512, 512))
        elif base_resolution == 768:
            return ASPECT_RATIOS_768.get(aspect_ratio, (768, 768))
        else:
            return ASPECT_RATIOS_1024.get(aspect_ratio, (1024, 1024))

    async def text_to_image(
        self,
        prompt: str,
        negative_prompt: str | None = None,
        aspect_ratio: str = "1:1",
        seed: int | None = None,
        num_inference_steps: int = 30,
        model: str | None = None,
    ) -> Image.Image:
        """
        Generate an image from text prompt.

        Args:
            prompt: Text description of the image to generate
            negative_prompt: What to avoid in the image
            aspect_ratio: Aspect ratio (1:1, 16:9, etc.)
            seed: Random seed for reproducibility
            num_inference_steps: Number of denoising steps
            model: Model ID to use

        Returns:
            PIL Image object
        """
        model_id = model or DEFAULT_MODEL_ID
        width, height = self._get_dimensions(aspect_ratio, model_id)

        logger.info(f"Generating image with model={model_id}, size={width}x{height}")

        def generate():
            pipeline = self._get_pipeline(model_id, "text2img")

            generator = None
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(seed)

            result = pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                width=width,
                height=height,
                num_inference_steps=num_inference_steps,
                generator=generator,
            )

            return result.images[0]

        # Run in thread pool
        loop = asyncio.get_event_loop()
        image = await loop.run_in_executor(None, generate)

        logger.info("Image generation completed")
        return image

    async def image_to_image(
        self,
        image: Image.Image,
        prompt: str,
        negative_prompt: str | None = None,
        strength: float = 0.8,
        seed: int | None = None,
        num_inference_steps: int = 30,
        model: str | None = None,
    ) -> Image.Image:
        """
        Transform an existing image based on a prompt.

        Args:
            image: Source PIL Image
            prompt: Text description for transformation
            negative_prompt: What to avoid
            strength: How much to transform (0.0-1.0)
            seed: Random seed
            num_inference_steps: Denoising steps
            model: Model ID to use

        Returns:
            PIL Image object
        """
        model_id = model or DEFAULT_MODEL_ID

        # Check if model supports img2img
        model_config = next(
            (m for m in AVAILABLE_MODELS if m["id"] == model_id),
            None
        )
        if model_config and "img2img" not in model_config["capabilities"]:
            # Fall back to SDXL for img2img
            model_id = DEFAULT_MODEL_ID
            logger.warning(f"Model {model} does not support img2img, using {model_id}")

        logger.info(f"Transforming image with model={model_id}, strength={strength}")

        def transform():
            pipeline = self._get_pipeline(model_id, "img2img")

            generator = None
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(seed)

            result = pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=image,
                strength=strength,
                num_inference_steps=num_inference_steps,
                generator=generator,
            )

            return result.images[0]

        loop = asyncio.get_event_loop()
        result_image = await loop.run_in_executor(None, transform)

        logger.info("Image transformation completed")
        return result_image

    async def inpaint(
        self,
        image: Image.Image,
        mask: Image.Image,
        prompt: str,
        negative_prompt: str | None = None,
        seed: int | None = None,
        num_inference_steps: int = 30,
        model: str | None = None,
    ) -> Image.Image:
        """
        Inpaint an image using a mask.

        Args:
            image: Source PIL Image
            mask: Mask PIL Image (white areas will be inpainted)
            prompt: Text description for inpainting
            negative_prompt: What to avoid
            seed: Random seed
            num_inference_steps: Denoising steps
            model: Model ID to use (inpainting uses dedicated model)

        Returns:
            PIL Image object
        """
        # Inpainting always uses the dedicated SDXL inpaint model
        logger.info(f"Inpainting image with steps={num_inference_steps}")

        def inpaint_fn():
            pipeline = self._get_pipeline(DEFAULT_MODEL_ID, "inpaint")

            generator = None
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(seed)

            result = pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=image,
                mask_image=mask,
                num_inference_steps=num_inference_steps,
                generator=generator,
            )

            return result.images[0]

        loop = asyncio.get_event_loop()
        result_image = await loop.run_in_executor(None, inpaint_fn)

        logger.info("Inpainting completed")
        return result_image

    def get_device_info(self) -> dict:
        """Get information about the current device."""
        info = {
            "device": self.device,
            "cuda_available": torch.cuda.is_available(),
        }

        if torch.cuda.is_available():
            info.update({
                "gpu_name": torch.cuda.get_device_name(0),
                "gpu_memory_total": torch.cuda.get_device_properties(0).total_memory,
                "gpu_memory_allocated": torch.cuda.memory_allocated(0),
                "gpu_memory_cached": torch.cuda.memory_reserved(0),
            })

        return info


# Singleton instance
_local_client: LocalInferenceClient | None = None


def get_local_client() -> LocalInferenceClient:
    """Get or create LocalInferenceClient instance."""
    global _local_client
    if _local_client is None:
        _local_client = LocalInferenceClient()
    return _local_client
