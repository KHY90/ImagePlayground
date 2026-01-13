"""Image storage and processing service."""

import json
import logging
import os
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from PIL import Image

from src.core.config import get_settings
from src.models.image import DEFAULT_EXPIRATION_HOURS

settings = get_settings()
logger = logging.getLogger(__name__)

# Thumbnail size
THUMBNAIL_SIZE = (256, 256)


class ImageService:
    """Service for image storage and processing."""

    def __init__(self):
        """Initialize image service and ensure directories exist."""
        self.upload_dir = Path(settings.upload_dir)
        self.generated_dir = Path(settings.generated_dir)

        # Create directories if they don't exist
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.generated_dir.mkdir(parents=True, exist_ok=True)

    def _get_user_dir(self, user_id: str, base_dir: Path) -> Path:
        """Get user-specific directory."""
        user_dir = base_dir / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir

    def _generate_filename(self, extension: str = "png") -> str:
        """Generate unique filename."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid4())[:8]
        return f"{timestamp}_{unique_id}.{extension}"

    async def save_generated_image(
        self,
        image: Image.Image,
        user_id: str,
        job_id: str,
        prompt: str,
        negative_prompt: str | None = None,
        parameters: dict | None = None,
    ) -> dict:
        """
        Save a generated image and create thumbnail.

        Args:
            image: PIL Image to save
            user_id: User ID
            job_id: Job ID
            prompt: Generation prompt
            negative_prompt: Negative prompt
            parameters: Full generation parameters

        Returns:
            Dictionary with image metadata
        """
        user_dir = self._get_user_dir(user_id, self.generated_dir)

        # Generate filenames
        filename = self._generate_filename("png")
        thumb_filename = f"thumb_{filename}"

        file_path = user_dir / filename
        thumb_path = user_dir / thumb_filename

        # Save main image
        image.save(file_path, format="PNG", optimize=True)
        file_size = file_path.stat().st_size

        # Create and save thumbnail
        thumbnail = image.copy()
        thumbnail.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
        thumbnail.save(thumb_path, format="PNG", optimize=True)

        logger.info(f"Saved image: {file_path} ({file_size} bytes)")

        return {
            "file_path": str(file_path),
            "thumbnail_path": str(thumb_path),
            "width": image.width,
            "height": image.height,
            "file_size": file_size,
            "mime_type": "image/png",
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "parameters_json": json.dumps(parameters) if parameters else None,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=DEFAULT_EXPIRATION_HOURS),
        }

    async def save_uploaded_image(
        self,
        image_data: bytes,
        user_id: str,
        filename: str | None = None,
    ) -> dict:
        """
        Save an uploaded image.

        Args:
            image_data: Raw image bytes
            user_id: User ID
            filename: Original filename (optional)

        Returns:
            Dictionary with image metadata
        """
        user_dir = self._get_user_dir(user_id, self.upload_dir)

        # Open image to validate and get metadata
        image = Image.open(BytesIO(image_data))

        # Convert to RGB if necessary
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # Generate filename
        extension = "png"
        save_filename = self._generate_filename(extension)
        file_path = user_dir / save_filename

        # Save image
        image.save(file_path, format="PNG", optimize=True)
        file_size = file_path.stat().st_size

        logger.info(f"Saved uploaded image: {file_path}")

        return {
            "file_path": str(file_path),
            "width": image.width,
            "height": image.height,
            "file_size": file_size,
            "mime_type": "image/png",
        }

    async def load_image(self, file_path: str) -> Image.Image:
        """Load an image from file path."""
        return Image.open(file_path)

    async def resize_image(
        self,
        image: Image.Image,
        target_width: int,
        target_height: int,
        mode: str = "crop",
    ) -> Image.Image:
        """
        Resize image to target dimensions.

        Args:
            image: Source image
            target_width: Target width
            target_height: Target height
            mode: 'crop' or 'pad'

        Returns:
            Resized image
        """
        if mode == "crop":
            # Crop to aspect ratio then resize
            target_ratio = target_width / target_height
            img_ratio = image.width / image.height

            if img_ratio > target_ratio:
                # Image is wider - crop width
                new_width = int(image.height * target_ratio)
                left = (image.width - new_width) // 2
                image = image.crop((left, 0, left + new_width, image.height))
            else:
                # Image is taller - crop height
                new_height = int(image.width / target_ratio)
                top = (image.height - new_height) // 2
                image = image.crop((0, top, image.width, top + new_height))

            return image.resize((target_width, target_height), Image.Resampling.LANCZOS)

        elif mode == "pad":
            # Resize maintaining aspect ratio and pad
            image.thumbnail((target_width, target_height), Image.Resampling.LANCZOS)

            # Create new image with padding
            new_image = Image.new("RGB", (target_width, target_height), (0, 0, 0))
            paste_x = (target_width - image.width) // 2
            paste_y = (target_height - image.height) // 2
            new_image.paste(image, (paste_x, paste_y))

            return new_image

        return image

    async def delete_image(self, file_path: str) -> bool:
        """Delete an image file."""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                logger.info(f"Deleted image: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to delete image {file_path}: {e}")
            return False

    async def get_image_bytes(self, file_path: str) -> bytes | None:
        """Get image as bytes for download."""
        try:
            path = Path(file_path)
            if path.exists():
                return path.read_bytes()
            return None
        except Exception as e:
            logger.error(f"Failed to read image {file_path}: {e}")
            return None


# Singleton instance
_image_service: ImageService | None = None


def get_image_service() -> ImageService:
    """Get or create image service instance."""
    global _image_service
    if _image_service is None:
        _image_service = ImageService()
    return _image_service
