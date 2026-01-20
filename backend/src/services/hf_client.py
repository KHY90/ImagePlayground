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
DEFAULT_INPAINT_MODEL = "diffusers/stable-diffusion-xl-1.0-inpainting-0.1"

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
            model: Model to use

        Returns:
            PIL Image object
        """
        if not self.client:
            raise RuntimeError("HuggingFace API token not configured")

        model = model or DEFAULT_INPAINT_MODEL

        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"Inpainting image (attempt {attempt + 1}/{MAX_RETRIES})")

                # Convert image to bytes
                img_bytes = BytesIO()
                image.save(img_bytes, format="PNG")
                img_bytes.seek(0)

                # Convert mask to bytes
                mask_bytes = BytesIO()
                mask.save(mask_bytes, format="PNG")
                mask_bytes.seek(0)

                # Use the image_to_image endpoint with mask parameter
                # Note: HuggingFace Inference API may not directly support inpainting
                # We'll use the dedicated inpaint method if available
                result = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self._call_inpaint_api(
                        image=img_bytes,
                        mask=mask_bytes,
                        prompt=prompt,
                        negative_prompt=negative_prompt,
                        model=model,
                        num_inference_steps=num_inference_steps,
                        seed=seed,
                    ),
                )

                logger.info("Inpainting successful")
                return result

            except Exception as e:
                logger.error(f"Inpainting attempt {attempt + 1} failed: {e}")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAY * (attempt + 1))
                else:
                    raise RuntimeError(f"Inpainting failed: {e}")

    def _call_inpaint_api(
        self,
        image: BytesIO,
        mask: BytesIO,
        prompt: str,
        negative_prompt: str | None,
        model: str,
        num_inference_steps: int,
        seed: int | None,
    ) -> Image.Image:
        """Call the inpainting API synchronously."""
        import requests

        # Use HuggingFace Inference API for inpainting
        api_url = f"https://api-inference.huggingface.co/models/{model}"
        headers = {"Authorization": f"Bearer {self.api_token}"}

        # Read image and mask bytes
        image.seek(0)
        mask.seek(0)

        # For SDXL inpainting model, we use multipart form data
        files = {
            "image": ("image.png", image.read(), "image/png"),
            "mask": ("mask.png", mask.read(), "image/png"),
        }
        data = {
            "prompt": prompt,
            "num_inference_steps": num_inference_steps,
        }
        if negative_prompt:
            data["negative_prompt"] = negative_prompt
        if seed is not None:
            data["seed"] = seed

        response = requests.post(api_url, headers=headers, files=files, data=data)

        if response.status_code != 200:
            # Fallback: try using text-to-image with the prompt and composite manually
            logger.warning(f"Inpaint API failed ({response.status_code}), using fallback")
            image.seek(0)
            mask.seek(0)
            return self._inpaint_fallback(image, mask, prompt, negative_prompt, num_inference_steps, seed)

        return Image.open(BytesIO(response.content))

    def _inpaint_fallback(
        self,
        image: BytesIO,
        mask: BytesIO,
        prompt: str,
        negative_prompt: str | None,
        num_inference_steps: int,
        seed: int | None,
    ) -> Image.Image:
        """Fallback inpainting using img2img and manual compositing."""
        # Load original image and mask
        original = Image.open(image).convert("RGB")
        mask_img = Image.open(mask).convert("L")

        # Ensure mask and image have same size
        if mask_img.size != original.size:
            mask_img = mask_img.resize(original.size, Image.Resampling.LANCZOS)

        # Generate new content using text-to-image at the same size
        generated = self.client.text_to_image(
            prompt=prompt,
            negative_prompt=negative_prompt,
            model=DEFAULT_TEXT2IMG_MODEL,
            width=original.width,
            height=original.height,
            num_inference_steps=num_inference_steps,
            seed=seed,
        )

        # Composite: use mask to blend original and generated
        # White (255) in mask = use generated, Black (0) = use original
        result = Image.composite(generated, original, mask_img)

        return result


# Singleton instance
_hf_client: HuggingFaceClient | None = None


def get_hf_client() -> HuggingFaceClient:
    """Get or create HuggingFace client instance."""
    global _hf_client
    if _hf_client is None:
        _hf_client = HuggingFaceClient()
    return _hf_client
