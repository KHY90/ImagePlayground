"""Seed default presets for inpainting."""

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from src.core.config import get_settings
from src.models.preset import Preset, PresetCategory

settings = get_settings()

DEFAULT_PRESETS = [
    {
        "name": "Remove Object",
        "name_ko": "오브젝트 제거",
        "description": "Remove unwanted objects from the image",
        "description_ko": "이미지에서 원하지 않는 오브젝트를 제거합니다",
        "category": PresetCategory.OBJECT_REMOVE.value,
        "default_prompt": "clean background, seamless, natural blend",
        "default_negative_prompt": "artifacts, distortion, blur, unnatural",
        "recommended_steps": 30,
        "recommended_strength": 0.85,
        "icon": "trash",
        "is_system": True,
        "sort_order": 1,
    },
    {
        "name": "Replace Background",
        "name_ko": "배경 교체",
        "description": "Replace the background with a new scene",
        "description_ko": "배경을 새로운 장면으로 교체합니다",
        "category": PresetCategory.BACKGROUND_REPLACE.value,
        "default_prompt": "beautiful scenery, natural lighting, high quality",
        "default_negative_prompt": "blurry, low quality, artifacts",
        "recommended_steps": 35,
        "recommended_strength": 0.9,
        "icon": "image",
        "is_system": True,
        "sort_order": 2,
    },
    {
        "name": "Add Object",
        "name_ko": "오브젝트 추가",
        "description": "Add new objects to the selected area",
        "description_ko": "선택한 영역에 새로운 오브젝트를 추가합니다",
        "category": PresetCategory.OBJECT_ADD.value,
        "default_prompt": "detailed, realistic, natural integration",
        "default_negative_prompt": "floating, unnatural, distorted",
        "recommended_steps": 30,
        "recommended_strength": 0.8,
        "icon": "plus-circle",
        "is_system": True,
        "sort_order": 3,
    },
    {
        "name": "Style Transfer",
        "name_ko": "스타일 변환",
        "description": "Change the style of the selected area",
        "description_ko": "선택한 영역의 스타일을 변경합니다",
        "category": PresetCategory.STYLE_TRANSFER.value,
        "default_prompt": "artistic, stylized, creative",
        "default_negative_prompt": "ugly, deformed, low quality",
        "recommended_steps": 40,
        "recommended_strength": 0.75,
        "icon": "palette",
        "is_system": True,
        "sort_order": 4,
    },
    {
        "name": "Restore & Repair",
        "name_ko": "복원 및 수정",
        "description": "Repair damaged or missing parts of the image",
        "description_ko": "이미지의 손상되거나 누락된 부분을 복원합니다",
        "category": PresetCategory.RESTORATION.value,
        "default_prompt": "restored, clean, sharp, high quality",
        "default_negative_prompt": "noise, artifacts, blur, damage",
        "recommended_steps": 35,
        "recommended_strength": 0.7,
        "icon": "wand",
        "is_system": True,
        "sort_order": 5,
    },
    {
        "name": "Face Enhance",
        "name_ko": "얼굴 보정",
        "description": "Enhance and beautify facial features",
        "description_ko": "얼굴 특징을 향상시키고 아름답게 만듭니다",
        "category": PresetCategory.RESTORATION.value,
        "default_prompt": "beautiful face, clear skin, natural, detailed features",
        "default_negative_prompt": "deformed, ugly, blurry, unnatural",
        "recommended_steps": 30,
        "recommended_strength": 0.6,
        "icon": "user",
        "is_system": True,
        "sort_order": 6,
    },
    {
        "name": "Sky Replacement",
        "name_ko": "하늘 교체",
        "description": "Replace the sky with a dramatic new one",
        "description_ko": "하늘을 드라마틱한 새로운 하늘로 교체합니다",
        "category": PresetCategory.BACKGROUND_REPLACE.value,
        "default_prompt": "beautiful sky, dramatic clouds, sunset, vibrant colors",
        "default_negative_prompt": "dull, gray, boring, flat",
        "recommended_steps": 30,
        "recommended_strength": 0.9,
        "icon": "cloud",
        "is_system": True,
        "sort_order": 7,
    },
    {
        "name": "Custom Edit",
        "name_ko": "사용자 정의 편집",
        "description": "Free-form editing with your own prompt",
        "description_ko": "자유 형식으로 직접 프롬프트를 입력하여 편집합니다",
        "category": PresetCategory.CUSTOM.value,
        "default_prompt": "",
        "default_negative_prompt": "low quality, blurry, artifacts",
        "recommended_steps": 30,
        "recommended_strength": 0.8,
        "icon": "edit",
        "is_system": True,
        "sort_order": 99,
    },
]


async def seed_presets():
    """Seed default presets into the database."""
    engine = create_async_engine(settings.database_url)

    async with AsyncSession(engine) as session:
        for preset_data in DEFAULT_PRESETS:
            # Check if preset already exists by name
            result = await session.execute(
                select(Preset).where(
                    Preset.name == preset_data["name"],
                    Preset.is_system == True,
                )
            )
            existing = result.scalar_one_or_none()

            if existing:
                # Update existing preset
                for key, value in preset_data.items():
                    setattr(existing, key, value)
                print(f"Updated preset: {preset_data['name']}")
            else:
                # Create new preset
                preset = Preset(**preset_data)
                session.add(preset)
                print(f"Created preset: {preset_data['name']}")

        await session.commit()
        print("Preset seeding completed!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_presets())
