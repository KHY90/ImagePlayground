# Research: AI 이미지 생성 및 편집 웹 서비스

**Date**: 2026-01-13
**Feature**: 001-ai-image-generator

## 1. Hugging Face Inference API Integration

### Decision
Hugging Face Inference API를 사용하여 Stable Diffusion 기반 이미지 생성 수행

### Rationale
- 자체 GPU 서버 없이 즉시 사용 가능
- 다양한 모델(SDXL, SD 1.5, Kandinsky 등) 지원
- huggingface_hub 라이브러리로 간편한 통합
- 요청당 과금으로 초기 비용 최소화

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| 자체 GPU 서버 호스팅 | 초기 비용 높음, 관리 복잡성 |
| Replicate API | 비용이 HF보다 높음, 모델 선택 제한적 |
| Stability AI API | 별도 계약 필요, HF가 더 유연함 |

### Implementation Notes
- `InferenceClient` 클래스 사용
- 모델: `stabilityai/stable-diffusion-xl-base-1.0` (Text-to-Image)
- 인페인팅: `runwayml/stable-diffusion-inpainting`
- 타임아웃: 120초 (이미지 생성 시간 고려)
- 재시도: 3회, 지수 백오프

## 2. 비동기 작업 처리

### Decision
FastAPI BackgroundTasks + 폴링 방식으로 비동기 작업 처리

### Rationale
- 소규모 서비스(100명 동시 사용자)에 적합
- Celery/Redis 없이 간단한 구성
- FastAPI 네이티브 기능으로 추가 의존성 최소화

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Celery + Redis | 소규모에 과도한 인프라 복잡성 |
| ARQ (asyncio Redis Queue) | Redis 의존성 추가 필요 |
| WebSocket 실시간 알림 | 폴링으로 충분, 구현 복잡성 증가 |

### Implementation Notes
- Job 상태: `pending` → `processing` → `completed` / `failed`
- 폴링 간격: 2초 (프론트엔드)
- 타임아웃: 120초 후 자동 실패 처리

## 3. 이미지 저장 전략

### Decision
로컬 파일 시스템 저장 + SQLite/PostgreSQL 메타데이터

### Rationale
- 2일 보관 정책으로 장기 스토리지 불필요
- 로컬 저장이 가장 빠르고 단순
- 향후 S3 전환 용이하도록 추상화 레이어 설계

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| AWS S3 | 초기 단계에서 과도한 비용/복잡성 |
| MinIO | 추가 인프라 관리 필요 |
| Base64 DB 저장 | 성능 저하, DB 크기 급증 |

### Implementation Notes
- 저장 경로: `./storage/images/{user_id}/{job_id}.png`
- 48시간 자동 삭제: cron 또는 APScheduler
- 파일명: UUID 기반으로 충돌 방지

## 4. 인증 시스템

### Decision
JWT 기반 세션 인증 (Access Token + Refresh Token)

### Rationale
- 이메일/비밀번호 로그인에 표준적인 접근법
- Stateless 서버로 확장성 확보
- python-jose 라이브러리로 간편 구현

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Session Cookie | 서버 상태 유지 필요, 확장성 제한 |
| OAuth2 (Google 등) | 요구사항에 없음, 추후 추가 가능 |
| API Key | 사용자 경험 저하 |

### Implementation Notes
- Access Token TTL: 30분
- Refresh Token TTL: 7일
- 비밀번호 해싱: bcrypt
- 보안 헤더: Authorization: Bearer {token}

## 5. 캔버스/마스킹 라이브러리

### Decision
Konva.js를 사용한 캔버스 기반 마스킹 UI

### Rationale
- 브러시, 레이어, 이미지 조작 기능 내장
- React 통합(react-konva) 용이
- 성능 최적화된 캔버스 렌더링

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| fabric.js | Konva.js보다 무거움, React 통합 덜 자연스러움 |
| 순수 Canvas API | 브러시/레이어 직접 구현 필요, 개발 시간 증가 |
| SVG 기반 | 래스터 이미지 처리에 부적합 |

### Implementation Notes
- Stage > Layer > Image/Shape 구조
- 브러시 도구: 자유형, 지우개, 색상 선택
- 마스크 내보내기: Base64 PNG (흑백)

## 6. 상태 관리 전략

### Decision
TanStack Query (서버 상태) + Zustand (UI 상태)

### Rationale
- 서버 데이터 캐싱/동기화는 TanStack Query가 최적
- UI 상태(캔버스, 폼)는 Zustand로 가볍게 관리
- Redux보다 보일러플레이트 적음

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Redux Toolkit | 보일러플레이트 많음, 소규모에 과도함 |
| Recoil | 메타 지원 불확실, Zustand가 더 성숙 |
| Context API만 | 복잡한 상태에 성능 이슈 |

### Implementation Notes
- TanStack Query: jobs, images, presets 쿼리
- Zustand stores: authStore, generationStore, canvasStore
- 낙관적 업데이트: 작업 생성 시 즉시 UI 반영

## 7. 프롬프트 필터링

### Decision
키워드 기반 금칙어 필터 + 카테고리 블랙리스트

### Rationale
- 초기 버전에서 간단한 규칙 기반 필터로 시작
- ML 기반 필터는 향후 고려
- 관리자가 금칙어 목록 관리 가능

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| OpenAI Moderation API | 외부 의존성, 비용 발생 |
| 자체 ML 모델 | 개발 복잡성, 초기에 과도함 |
| 필터 없음 | 안전/정책 요구사항 미충족 |

### Implementation Notes
- 금칙어 DB 테이블: `banned_words`
- 검사 시점: 작업 생성 전 (API 레벨)
- 응답: 400 Bad Request + 구체적 오류 메시지

## 8. 이미지 크기/형식 제한

### Decision
최대 10MB, PNG/JPEG/WebP 허용, 최대 4096x4096px

### Rationale
- HuggingFace API 제한 준수
- 일반적인 웹 이미지 크기 범위
- 메모리 사용량 관리

### Implementation Notes
- 업로드 시 PIL로 형식/크기 검증
- 초과 시 자동 리사이즈 (비율 유지)
- 지원 MIME: image/png, image/jpeg, image/webp

## Summary

모든 기술 결정이 완료되었습니다. NEEDS CLARIFICATION 항목 없음.

| 영역 | 결정 | 상태 |
|------|------|------|
| AI 모델 API | Hugging Face Inference API | ✅ |
| 비동기 처리 | FastAPI BackgroundTasks | ✅ |
| 이미지 저장 | 로컬 파일 시스템 | ✅ |
| 인증 | JWT (Access + Refresh) | ✅ |
| 캔버스 | Konva.js (react-konva) | ✅ |
| 상태 관리 | TanStack Query + Zustand | ✅ |
| 프롬프트 필터 | 키워드 기반 금칙어 | ✅ |
| 이미지 제한 | 10MB, 4096x4096px | ✅ |
