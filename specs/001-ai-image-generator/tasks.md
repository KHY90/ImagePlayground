# Tasks: AI 이미지 생성 및 편집 웹 서비스

**Feature**: 001-ai-image-generator
**Generated**: 2026-01-13
**Source**: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md)

## Overview

이 문서는 AI 이미지 생성 및 편집 웹 서비스의 구현 태스크를 사용자 스토리별로 정리합니다.

**Notation**:
- `[P]` = Parallelizable (다른 태스크와 병렬 실행 가능)
- `[US1]`-`[US5]` = 해당 User Story 관련 태스크
- `[SETUP]` = 초기 설정 태스크
- `[INFRA]` = 인프라/공통 태스크

---

## Phase 1: Project Setup

### 1.1 Backend Setup

- [x] **T001** [SETUP] Python 프로젝트 초기화 및 pyproject.toml 설정 (`backend/pyproject.toml`)
- [x] **T002** [SETUP] FastAPI 의존성 설치 및 requirements.txt 생성 (`backend/requirements.txt`)
- [x] **T003** [SETUP] 프로젝트 디렉토리 구조 생성 (`backend/src/`)
- [x] **T004** [SETUP] 환경 변수 설정 파일 생성 (`backend/.env.example`)
- [x] **T005** [SETUP] pytest 설정 및 conftest.py 생성 (`backend/tests/conftest.py`)

### 1.2 Frontend Setup

- [x] **T006** [P] [SETUP] Vite + React + TypeScript 프로젝트 초기화 (`frontend/`)
- [x] **T007** [P] [SETUP] TailwindCSS 설정 (`frontend/tailwind.config.js`)
- [x] **T008** [P] [SETUP] 프론트엔드 의존성 설치 (TanStack Query, Zustand, React Router, Konva.js)
- [x] **T009** [P] [SETUP] TypeScript 타입 정의 파일 생성 (`frontend/src/types/index.ts`)
- [x] **T010** [P] [SETUP] Vitest 설정 (`frontend/vite.config.ts`)

---

## Phase 2: Infrastructure & Authentication (Foundation)

### 2.1 Database & Core

- [x] **T011** [INFRA] SQLAlchemy 데이터베이스 연결 설정 (`backend/src/core/database.py`)
- [x] **T012** [INFRA] Pydantic 설정 관리 클래스 구현 (`backend/src/core/config.py`)
- [x] **T013** [INFRA] Alembic 마이그레이션 초기화 (`backend/alembic/`)
- [x] **T014** [INFRA] User 모델 구현 (`backend/src/models/user.py`)
- [x] **T015** [INFRA] DailyUsage 모델 구현 (`backend/src/models/daily_usage.py`)
- [ ] **T016** [INFRA] 초기 마이그레이션 파일 생성 및 실행

### 2.2 Authentication Backend

- [x] **T017** [INFRA] JWT 토큰 유틸리티 구현 (`backend/src/core/security.py`)
- [x] **T018** [INFRA] 비밀번호 해싱 유틸리티 (bcrypt) 구현 (`backend/src/core/security.py`)
- [x] **T019** [INFRA] 인증 스키마 정의 (`backend/src/schemas/auth.py`)
- [x] **T020** [INFRA] AuthService 구현 - 회원가입, 로그인, 토큰 갱신 (`backend/src/services/auth_service.py`)
- [x] **T021** [INFRA] 인증 의존성 주입 (get_current_user) (`backend/src/api/deps.py`)
- [x] **T022** [INFRA] Auth 라우터 구현 - POST /auth/register (`backend/src/api/routes/auth.py`)
- [x] **T023** [INFRA] Auth 라우터 구현 - POST /auth/login (`backend/src/api/routes/auth.py`)
- [x] **T024** [INFRA] Auth 라우터 구현 - POST /auth/refresh (`backend/src/api/routes/auth.py`)
- [x] **T025** [INFRA] Auth 라우터 구현 - GET /auth/me (`backend/src/api/routes/auth.py`)
- [x] **T026** [INFRA] FastAPI 앱 진입점 및 라우터 등록 (`backend/src/main.py`)
- [ ] **T027** [INFRA] 인증 API 단위 테스트 작성 (`backend/tests/unit/test_auth.py`)

### 2.3 Authentication Frontend

- [x] **T028** [P] [INFRA] API 클라이언트 설정 (axios + interceptors) (`frontend/src/services/api.ts`)
- [x] **T029** [P] [INFRA] Auth 스토어 구현 (Zustand) (`frontend/src/stores/authStore.ts`)
- [x] **T030** [P] [INFRA] useAuth 훅 구현 (`frontend/src/hooks/useAuth.ts`)
- [x] **T031** [P] [INFRA] 로그인 페이지 구현 (`frontend/src/pages/LoginPage.tsx`)
- [x] **T032** [P] [INFRA] 회원가입 페이지 구현 (`frontend/src/pages/RegisterPage.tsx`)
- [x] **T033** [P] [INFRA] ProtectedRoute 컴포넌트 구현 (`frontend/src/components/common/ProtectedRoute.tsx`)
- [x] **T034** [P] [INFRA] React Router 설정 및 App.tsx 구성 (`frontend/src/App.tsx`)
- [x] **T035** [P] [INFRA] 공통 레이아웃 컴포넌트 (Header, Footer) (`frontend/src/components/common/Layout.tsx`)

---

## Phase 3: US1 - Text-to-Image (P1) MVP

### 3.1 Job System Backend

- [x] **T036** [US1] Job 모델 구현 (status, type, parameters 등) (`backend/src/models/job.py`)
- [x] **T037** [US1] GeneratedImage 모델 구현 (`backend/src/models/image.py`)
- [x] **T038** [US1] Job 스키마 정의 (`backend/src/schemas/job.py`)
- [x] **T039** [US1] Image 스키마 정의 (`backend/src/schemas/image.py`)
- [ ] **T040** [US1] Job/GeneratedImage 마이그레이션 생성 및 실행

### 3.2 HuggingFace Integration

- [x] **T041** [US1] HuggingFace InferenceClient 래퍼 구현 (`backend/src/services/hf_client.py`)
- [x] **T042** [US1] Text-to-Image 생성 메서드 구현 (`backend/src/services/hf_client.py`)
- [x] **T043** [US1] 이미지 저장 서비스 구현 (`backend/src/services/image_service.py`)
- [x] **T044** [US1] 재시도 로직 및 에러 핸들링 구현 (`backend/src/services/hf_client.py`)

### 3.3 Job Processing

- [x] **T045** [US1] JobService 구현 - 작업 생성 (`backend/src/services/job_service.py`)
- [x] **T046** [US1] JobService 구현 - 작업 상태 조회 (`backend/src/services/job_service.py`)
- [x] **T047** [US1] BackgroundTasks를 이용한 비동기 이미지 생성 처리 (`backend/src/services/job_service.py`)
- [x] **T048** [US1] 일일 사용량 체크 및 제한 로직 구현 (`backend/src/services/job_service.py`)

### 3.4 Jobs API

- [x] **T049** [US1] Jobs 라우터 구현 - POST /jobs (작업 생성) (`backend/src/api/routes/jobs.py`)
- [x] **T050** [US1] Jobs 라우터 구현 - GET /jobs (목록 조회) (`backend/src/api/routes/jobs.py`)
- [x] **T051** [US1] Jobs 라우터 구현 - GET /jobs/{jobId} (상세 조회) (`backend/src/api/routes/jobs.py`)
- [ ] **T052** [US1] Jobs API 단위 테스트 작성 (`backend/tests/unit/test_jobs.py`)
- [ ] **T053** [US1] HuggingFace 클라이언트 통합 테스트 (`backend/tests/integration/test_hf_client.py`)

### 3.5 Text-to-Image Frontend

- [x] **T054** [P] [US1] Generation 스토어 구현 (파라미터 상태 관리) (`frontend/src/stores/generationStore.ts`)
- [x] **T055** [P] [US1] useJobs 훅 구현 (TanStack Query) (`frontend/src/hooks/useJobs.ts`)
- [x] **T056** [P] [US1] PromptInput 컴포넌트 (메인/네거티브 프롬프트) (`frontend/src/components/generation/PromptInput.tsx`)
- [x] **T057** [P] [US1] ParameterPanel 컴포넌트 (비율, 시드, 스텝 등) (`frontend/src/components/generation/ParameterPanel.tsx`)
- [x] **T058** [P] [US1] GenerateButton 컴포넌트 (`frontend/src/components/generation/GenerateButton.tsx`)
- [x] **T059** [P] [US1] JobStatusIndicator 컴포넌트 (폴링 상태 표시) (`frontend/src/components/generation/JobStatusIndicator.tsx`)
- [x] **T060** [P] [US1] ImagePreview 컴포넌트 (결과 이미지 표시) (`frontend/src/components/generation/ImagePreview.tsx`)
- [x] **T061** [P] [US1] DownloadButton 컴포넌트 (`frontend/src/components/generation/DownloadButton.tsx`)
- [x] **T062** [P] [US1] UsageIndicator 컴포넌트 (일일 사용량 표시) (`frontend/src/components/common/UsageIndicator.tsx`)
- [x] **T063** [P] [US1] HomePage 구현 (Text-to-Image 모드) (`frontend/src/pages/HomePage.tsx`)
- [ ] **T064** [US1] Text-to-Image E2E 흐름 테스트

---

## Phase 4: US2 - Image-to-Image (P2)

### 4.1 Image-to-Image Backend

- [x] **T065** [US2] Image-to-Image 생성 메서드 구현 (`backend/src/services/hf_client.py`)
- [x] **T066** [US2] 이미지 업로드 처리 및 검증 로직 구현 (`backend/src/api/routes/images.py`)
- [x] **T067** [US2] 이미지 리사이즈/크롭 유틸리티 구현 (`backend/src/services/image_service.py`)
- [x] **T068** [US2] Jobs 라우터 - img2img 타입 지원 추가 (`backend/src/api/routes/jobs.py`)
- [ ] **T069** [US2] Image-to-Image API 테스트 작성 (`backend/tests/unit/test_img2img.py`)

### 4.2 Image-to-Image Frontend

- [x] **T070** [P] [US2] ImageUploader 컴포넌트 (`frontend/src/components/generation/ImageUploader.tsx`)
- [x] **T071** [P] [US2] StrengthSlider 컴포넌트 (변형 강도 조절) (`frontend/src/components/generation/StrengthSlider.tsx`)
- [x] **T072** [P] [US2] ResizeOptions 컴포넌트 (크롭/패딩 선택) (`frontend/src/components/generation/ResizeOptions.tsx`)
- [x] **T073** [P] [US2] GenerationModeSelector 컴포넌트 (Text2Img/Img2Img 전환) (`frontend/src/components/generation/GenerationModeSelector.tsx`)
- [x] **T074** [US2] HomePage - Image-to-Image 모드 통합 (`frontend/src/pages/HomePage.tsx`)
- [ ] **T075** [US2] Image-to-Image E2E 흐름 테스트

---

## Phase 5: US3 - Inpainting (P3)

### 5.1 Inpainting Backend

- [ ] **T076** [US3] Inpainting 생성 메서드 구현 (`backend/src/services/hf_client.py`)
- [ ] **T077** [US3] 마스크 이미지 처리 로직 구현 (`backend/src/services/image_service.py`)
- [ ] **T078** [US3] Preset 모델 구현 (`backend/src/models/preset.py`)
- [ ] **T079** [US3] Preset 스키마 및 라우터 구현 (`backend/src/api/routes/presets.py`)
- [ ] **T080** [US3] Jobs 라우터 - inpaint 타입 지원 추가 (`backend/src/api/routes/jobs.py`)
- [ ] **T081** [US3] 기본 프리셋 데이터 시딩 (배경 교체, 오브젝트 제거 등)
- [ ] **T082** [US3] Inpainting API 테스트 작성 (`backend/tests/unit/test_inpaint.py`)

### 5.2 Canvas & Masking Frontend

- [ ] **T083** [P] [US3] Canvas 스토어 구현 (Zustand) (`frontend/src/stores/canvasStore.ts`)
- [ ] **T084** [P] [US3] useCanvas 훅 구현 (`frontend/src/hooks/useCanvas.ts`)
- [ ] **T085** [P] [US3] MaskCanvas 컴포넌트 (Konva.js Stage 설정) (`frontend/src/components/canvas/MaskCanvas.tsx`)
- [ ] **T086** [P] [US3] BrushTool 컴포넌트 (브러시 크기, 색상) (`frontend/src/components/canvas/BrushTool.tsx`)
- [ ] **T087** [P] [US3] EraserTool 컴포넌트 (`frontend/src/components/canvas/EraserTool.tsx`)
- [ ] **T088** [P] [US3] CanvasToolbar 컴포넌트 (도구 선택 UI) (`frontend/src/components/canvas/CanvasToolbar.tsx`)
- [ ] **T089** [P] [US3] MaskExporter 유틸리티 (Canvas -> Base64 PNG) (`frontend/src/components/canvas/MaskExporter.ts`)
- [ ] **T090** [P] [US3] PresetSelector 컴포넌트 (`frontend/src/components/generation/PresetSelector.tsx`)
- [ ] **T091** [US3] HomePage - Inpainting 모드 통합 (`frontend/src/pages/HomePage.tsx`)
- [ ] **T092** [US3] Inpainting E2E 흐름 테스트

---

## Phase 6: US4 - Gallery & History (P4)

### 6.1 Gallery Backend

- [ ] **T093** [US4] Images 라우터 구현 - GET /images (갤러리 목록) (`backend/src/api/routes/images.py`)
- [ ] **T094** [US4] Images 라우터 구현 - GET /images/{imageId} (상세 조회) (`backend/src/api/routes/images.py`)
- [ ] **T095** [US4] Images 라우터 구현 - GET /images/{imageId}/download (`backend/src/api/routes/images.py`)
- [ ] **T096** [US4] 페이지네이션 로직 구현 (`backend/src/api/routes/images.py`)
- [ ] **T097** [US4] Gallery API 테스트 작성 (`backend/tests/unit/test_gallery.py`)

### 6.2 Gallery Frontend

- [ ] **T098** [P] [US4] useGallery 훅 구현 (TanStack Query + 페이지네이션) (`frontend/src/hooks/useGallery.ts`)
- [ ] **T099** [P] [US4] GalleryGrid 컴포넌트 (이미지 그리드 표시) (`frontend/src/components/gallery/GalleryGrid.tsx`)
- [ ] **T100** [P] [US4] GalleryCard 컴포넌트 (썸네일 + 기본 정보) (`frontend/src/components/gallery/GalleryCard.tsx`)
- [ ] **T101** [P] [US4] ImageDetailModal 컴포넌트 (상세 정보 + 파라미터) (`frontend/src/components/gallery/ImageDetailModal.tsx`)
- [ ] **T102** [P] [US4] ReuseParametersButton 컴포넌트 (파라미터 복제) (`frontend/src/components/gallery/ReuseParametersButton.tsx`)
- [ ] **T103** [P] [US4] RegenerateButton 컴포넌트 (재실행) (`frontend/src/components/gallery/RegenerateButton.tsx`)
- [ ] **T104** [P] [US4] Pagination 컴포넌트 (`frontend/src/components/common/Pagination.tsx`)
- [ ] **T105** [US4] GalleryPage 구현 (`frontend/src/pages/GalleryPage.tsx`)
- [ ] **T106** [US4] Gallery E2E 흐름 테스트

---

## Phase 8: Cleanup & Polish

### 8.1 Image Cleanup Service

- [ ] **T117** [INFRA] CleanupService 구현 - 만료 이미지 삭제 (`backend/src/services/cleanup_service.py`)
- [ ] **T118** [INFRA] APScheduler 또는 cron 작업 설정 (48시간 주기)
- [ ] **T119** [INFRA] Cleanup 서비스 테스트 작성 (`backend/tests/unit/test_cleanup.py`)

### 8.2 Error Handling & UX

- [ ] **T120** [INFRA] 글로벌 에러 핸들러 구현 (`backend/src/main.py`)
- [x] **T121** [INFRA] CORS 설정 (`backend/src/main.py`)
- [ ] **T122** [P] [INFRA] ErrorBoundary 컴포넌트 (`frontend/src/components/common/ErrorBoundary.tsx`)
- [ ] **T123** [P] [INFRA] Toast/Notification 시스템 구현 (`frontend/src/components/common/Toast.tsx`)
- [ ] **T124** [P] [INFRA] Loading 스켈레톤 컴포넌트 (`frontend/src/components/common/Skeleton.tsx`)

### 8.3 Final Testing & Documentation

- [ ] **T125** [INFRA] 통합 테스트 스위트 실행 및 수정
- [ ] **T126** [INFRA] API 문서 (OpenAPI) 검증
- [x] **T127** [INFRA] README.md 작성 (`backend/README.md`, `frontend/README.md`)

---

## Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1 | T001-T010 | 프로젝트 초기 설정 |
| Phase 2 | T011-T035 | 인프라 및 인증 시스템 |
| Phase 3 | T036-T064 | Text-to-Image (US1) MVP |
| Phase 4 | T065-T075 | Image-to-Image (US2) |
| Phase 5 | T076-T092 | Inpainting (US3) |
| Phase 6 | T093-T106 | Gallery & History (US4) |
| Phase 7 | T107-T116 | Admin Monitoring (US5) |
| Phase 8 | T117-T127 | Cleanup & Polish |

**Total**: 127 Tasks

## Dependencies

```
Phase 1 (Setup) -> Phase 2 (Auth/Infra) -> Phase 3 (US1 - MVP)
                                              |
                    Phase 4 (US2) <-----------+
                         |
                    Phase 5 (US3)
                         |
                    Phase 6 (US4)
                         |
                    Phase 7 (US5)
                         |
                    Phase 8 (Polish)
```

## MVP Milestone

**MVP 완료 기준**: Phase 1 + Phase 2 + Phase 3 완료 시
- 사용자 회원가입/로그인
- Text-to-Image 이미지 생성
- 작업 상태 확인 및 결과 다운로드
- 일일 사용량 제한

---

*Generated by SpecKit /tasks command*
