"""HuggingFace Inference Client wrapper."""

import asyncio
import logging
from io import BytesIO

from huggingface_hub import InferenceClient
from PIL import Image

from src.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Default model for text-to-image
DEFAULT_TEXT2IMG_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
DEFAULT_IMG2IMG_MODEL = "stabilityai/stable-diffusion-xl-refiner-1.0"

# Aspect ratio to dimensions mapping
ASPECT_RATIOS = {
    "1:1": (1024, 1024),
    "16:9": (1344, 768),
    "9:16": (768, 1344),
    "4:3": (1152, 896),
    "3:4": (896, 1152),
    "3:2": (1216, 832),
    "2:3": (832, 1216),
}

# Maximum retries for API calls
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds


class HuggingFaceClient:
    """Wrapper for HuggingFace Inference API."""

    def __init__(self, api_token: str | None = None):
        """Initialize the client with API token."""
        self.api_token = api_token or settings.huggingface_api_token
        if not self.api_token:
            logger.warning("HuggingFace API token not configured")
        self.client = InferenceClient(token=self.api_token) if self.api_token else None

    def _get_dimensions(self, aspect_ratio: str) -> tuple[int, int]:
        """Get image dimensions from aspect ratio."""
        return ASPECT_RATIOS.get(aspect_ratio, (1024, 1024))

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
            model: Model to use (defaults to SDXL)

        Returns:
            PIL Image object

        Raises:
            RuntimeError: If generation fails after retries
        """
        if not self.client:
            raise RuntimeError("HuggingFace API token not configured")

        model = model or DEFAULT_TEXT2IMG_MODEL
        width, height = self._get_dimensions(aspect_ratio)

        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"Generating image (attempt {attempt + 1}/{MAX_RETRIES})")

                # Run in thread pool since HF client is synchronous
                image = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.client.text_to_image(
                        prompt=prompt,
                        negative_prompt=negative_prompt,
                        model=model,
                        width=width,
                        height=height,
                        num_inference_steps=num_inference_steps,
                        seed=seed,
                    ),
                )

                logger.info("Image generated successfully")
                return image

            except Exception as e:
                logger.error(f"Generation attempt {attempt + 1} failed: {e}")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAY * (attempt + 1))
                else:
                    raise RuntimeError(f"Image generation failed after {MAX_RETRIES} attempts: {e}")

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
            model: Model to use

        Returns:
            PIL Image object
        """
        if not self.client:
            raise RuntimeError("HuggingFace API token not configured")

        model = model or DEFAULT_IMG2IMG_MODEL

        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"Transforming image (attempt {attempt + 1}/{MAX_RETRIES})")

                # Convert image to bytes
                img_bytes = BytesIO()
                image.save(img_bytes, format="PNG")
                img_bytes.seek(0)

                result = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.client.image_to_image(
                        image=img_bytes,
                        prompt=prompt,
                        negative_prompt=negative_prompt,
                        model=model,
                        strength=strength,
                        num_inference_steps=num_inference_steps,
                        seed=seed,
                    ),
                )

                logger.info("Image transformation successful")
                return result

            except Exception as e:
                logger.error(f"Transformation attempt {attempt + 1} failed: {e}")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAY * (attempt + 1))
                else:
                    raise RuntimeError(f"Image transformation failed: {e}")


# Singleton instance
_hf_client: HuggingFaceClient | None = None


def get_hf_client() -> HuggingFaceClient:
    """Get or create HuggingFace client instance."""
    global _hf_client
    if _hf_client is None:
        _hf_client = HuggingFaceClient()
    return _hf_client
