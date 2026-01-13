# Data Model: AI 이미지 생성 및 편집 웹 서비스

**Date**: 2026-01-13
**Feature**: 001-ai-image-generator

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌──────────────────┐
│    User     │───1:N─│     Job     │───1:1─│  GeneratedImage  │
└─────────────┘       └─────────────┘       └──────────────────┘
       │                     │
       │                     │
       └──────────1:N────────┘
                 │
          ┌──────┴──────┐
          │  DailyUsage │
          └─────────────┘

┌─────────────┐       ┌─────────────┐
│   Preset    │       │ BannedWord  │
└─────────────┘       └─────────────┘
```

## Entities

### User

사용자 계정 정보

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 고유 식별자 |
| email | String(255) | UNIQUE, NOT NULL | 이메일 주소 |
| password_hash | String(255) | NOT NULL | bcrypt 해시된 비밀번호 |
| is_active | Boolean | DEFAULT true | 계정 활성화 상태 |
| is_admin | Boolean | DEFAULT false | 관리자 여부 |
| created_at | DateTime | NOT NULL | 가입 일시 |
| updated_at | DateTime | NOT NULL | 수정 일시 |

**Indexes**:
- `idx_user_email` on `email`

**Validation**:
- email: 유효한 이메일 형식
- password: 최소 8자, 영문+숫자 조합

---

### Job

이미지 생성 작업

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 고유 식별자 |
| user_id | UUID | FK(User), NOT NULL | 요청 사용자 |
| type | Enum | NOT NULL | 작업 유형 (text2img, img2img, inpaint) |
| status | Enum | NOT NULL | 상태 (pending, processing, completed, failed) |
| prompt | Text | NOT NULL | 메인 프롬프트 |
| negative_prompt | Text | NULLABLE | 네거티브 프롬프트 |
| parameters | JSON | NOT NULL | 생성 파라미터 |
| input_image_path | String(500) | NULLABLE | 입력 이미지 경로 (img2img, inpaint) |
| mask_path | String(500) | NULLABLE | 마스크 경로 (inpaint) |
| error_message | Text | NULLABLE | 실패 시 오류 메시지 |
| created_at | DateTime | NOT NULL | 생성 일시 |
| started_at | DateTime | NULLABLE | 처리 시작 일시 |
| completed_at | DateTime | NULLABLE | 완료 일시 |

**Indexes**:
- `idx_job_user_id` on `user_id`
- `idx_job_status` on `status`
- `idx_job_created_at` on `created_at`

**State Transitions**:
```
pending → processing → completed
                    ↘ failed
```

**Parameters JSON Schema**:
```json
{
  "aspect_ratio": "1:1" | "4:3" | "3:4" | "16:9" | "9:16",
  "width": 512-2048,
  "height": 512-2048,
  "seed": -1 (auto) | 0-2147483647,
  "steps": 20-50,
  "guidance_scale": 1.0-20.0,
  "strength": 0.0-1.0 (img2img only)
}
```

---

### GeneratedImage

생성된 이미지

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 고유 식별자 |
| job_id | UUID | FK(Job), UNIQUE, NOT NULL | 관련 작업 |
| user_id | UUID | FK(User), NOT NULL | 소유 사용자 |
| file_path | String(500) | NOT NULL | 이미지 파일 경로 |
| file_size | Integer | NOT NULL | 파일 크기 (bytes) |
| width | Integer | NOT NULL | 이미지 너비 |
| height | Integer | NOT NULL | 이미지 높이 |
| seed_used | BigInteger | NOT NULL | 사용된 시드 값 |
| created_at | DateTime | NOT NULL | 생성 일시 |
| expires_at | DateTime | NOT NULL | 만료 일시 (생성 후 48시간) |

**Indexes**:
- `idx_image_user_id` on `user_id`
- `idx_image_expires_at` on `expires_at`
- `idx_image_job_id` on `job_id`

**Validation**:
- file_path: 존재하는 파일 경로
- expires_at: created_at + 48시간

---

### DailyUsage

일일 사용량 추적

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 고유 식별자 |
| user_id | UUID | FK(User), NOT NULL | 사용자 |
| date | Date | NOT NULL | 날짜 |
| generation_count | Integer | DEFAULT 0 | 생성 횟수 |

**Indexes**:
- `idx_usage_user_date` on `(user_id, date)` UNIQUE

**Validation**:
- generation_count: 0-3 (일일 제한)

---

### Preset

생성 파라미터 프리셋

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 고유 식별자 |
| name | String(100) | NOT NULL | 프리셋 이름 |
| description | Text | NULLABLE | 설명 |
| type | Enum | NOT NULL | 유형 (text2img, img2img, inpaint) |
| parameters | JSON | NOT NULL | 기본 파라미터 |
| is_default | Boolean | DEFAULT false | 기본 프리셋 여부 |
| created_at | DateTime | NOT NULL | 생성 일시 |

**Validation**:
- 각 type별 하나의 is_default=true만 존재

---

### BannedWord

금칙어 목록

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | 고유 식별자 |
| word | String(100) | UNIQUE, NOT NULL | 금칙어 |
| category | String(50) | NULLABLE | 카테고리 |
| is_active | Boolean | DEFAULT true | 활성화 상태 |
| created_at | DateTime | NOT NULL | 등록 일시 |

**Indexes**:
- `idx_banned_word` on `word`

---

## Enumerations

### JobType
```python
class JobType(str, Enum):
    TEXT2IMG = "text2img"
    IMG2IMG = "img2img"
    INPAINT = "inpaint"
```

### JobStatus
```python
class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
```

### AspectRatio
```python
class AspectRatio(str, Enum):
    SQUARE = "1:1"       # 512x512, 1024x1024
    LANDSCAPE_4_3 = "4:3"  # 768x576, 1024x768
    PORTRAIT_3_4 = "3:4"   # 576x768, 768x1024
    WIDE_16_9 = "16:9"     # 1024x576
    TALL_9_16 = "9:16"     # 576x1024
```

## Data Lifecycle

### Image Cleanup (48시간 후 자동 삭제)

```sql
-- 만료된 이미지 조회
SELECT * FROM generated_images WHERE expires_at < NOW();

-- 삭제 프로세스
1. 파일 시스템에서 이미지 파일 삭제
2. DB에서 GeneratedImage 레코드 삭제
3. 관련 Job의 input_image_path, mask_path도 정리
```

### Daily Usage Reset

```sql
-- 매일 자정에 새로운 날짜 레코드 자동 생성
-- 또는 첫 요청 시 해당 날짜 레코드 생성 (lazy)
```
