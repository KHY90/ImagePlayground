# Implementation Plan: AI 이미지 생성 및 편집 웹 서비스

**Branch**: `001-ai-image-generator` | **Date**: 2026-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-image-generator/spec.md`

## Summary

AI 기반 이미지 생성/편집 웹 서비스로, Text-to-Image, Image-to-Image, 인페인팅 기능을 제공한다. Hugging Face Inference API를 통해 이미지 생성을 수행하며, React 프론트엔드와 FastAPI 백엔드로 구성된다. 사용자 인증(이메일/비밀번호), 일일 3회 생성 제한, 2일 이미지 보관 정책을 적용한다.

## Technical Context

**Language/Version**: Python 3.11 (Backend), TypeScript 5.x (Frontend)
**Primary Dependencies**:
- Backend: FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, huggingface_hub
- Frontend: React 18, Vite, TailwindCSS, TanStack Query, Zustand, React Router, Konva.js
**Storage**: SQLite (개발) / PostgreSQL (프로덕션), Local File System (이미지)
**Testing**: pytest (Backend), Vitest (Frontend)
**Target Platform**: Web (Desktop-first, 모던 브라우저)
**Project Type**: Web Application (Frontend + Backend)
**Performance Goals**: 이미지 생성 60초 이내, 100명 동시 사용자 지원
**Constraints**: 사용자당 일일 3회 생성 제한, 이미지 2일 보관 후 자동 삭제
**Scale/Scope**: 100명 동시 사용자, 소규모 서비스

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> **Note**: 프로젝트 Constitution이 아직 정의되지 않았습니다 (템플릿 상태).
> 기본 소프트웨어 엔지니어링 원칙을 적용합니다:
> - ✅ 단일 책임 원칙 준수
> - ✅ 테스트 가능한 구조
> - ✅ 명확한 API 계약
> - ✅ 관심사 분리 (Frontend/Backend)

## Project Structure

### Documentation (this feature)

\`\`\`text
specs/001-ai-image-generator/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
\`\`\`

### Source Code (repository root)

\`\`\`text
backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py          # 인증 관련 엔드포인트
│   │   │   ├── jobs.py          # 작업 생성/조회 엔드포인트
│   │   │   ├── images.py        # 이미지 다운로드/갤러리
│   │   │   └── presets.py       # 프리셋 관리
│   │   └── deps.py              # 의존성 주입
│   ├── models/
│   │   ├── user.py              # User 모델
│   │   ├── job.py               # Job 모델
│   │   └── image.py             # GeneratedImage 모델
│   ├── services/
│   │   ├── auth_service.py      # 인증 로직
│   │   ├── job_service.py       # 작업 처리 로직
│   │   ├── image_service.py     # 이미지 생성/관리
│   │   ├── hf_client.py         # HuggingFace API 클라이언트
│   │   └── cleanup_service.py   # 이미지 자동 삭제
│   ├── schemas/
│   │   ├── auth.py              # 인증 스키마
│   │   ├── job.py               # 작업 스키마
│   │   └── image.py             # 이미지 스키마
│   ├── core/
│   │   ├── config.py            # 설정 관리
│   │   ├── security.py          # 보안 유틸리티
│   │   └── database.py          # DB 연결
│   └── main.py                  # FastAPI 앱 진입점
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── alembic/                     # DB 마이그레이션
├── requirements.txt
└── pyproject.toml

frontend/
├── src/
│   ├── components/
│   │   ├── common/              # 공통 컴포넌트
│   │   ├── canvas/              # 캔버스/마스킹 컴포넌트
│   │   ├── generation/          # 이미지 생성 관련
│   │   └── gallery/             # 갤러리 컴포넌트
│   ├── pages/
│   │   ├── HomePage.tsx         # 메인 생성 페이지
│   │   ├── GalleryPage.tsx      # 갤러리 페이지
│   │   ├── LoginPage.tsx        # 로그인 페이지
│   │   └── RegisterPage.tsx     # 회원가입 페이지
│   ├── services/
│   │   ├── api.ts               # API 클라이언트
│   │   ├── authService.ts       # 인증 서비스
│   │   └── jobService.ts        # 작업 서비스
│   ├── stores/
│   │   ├── authStore.ts         # 인증 상태
│   │   ├── generationStore.ts   # 생성 파라미터 상태
│   │   └── canvasStore.ts       # 캔버스 상태
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useJobs.ts
│   │   └── useCanvas.ts
│   ├── types/
│   │   └── index.ts             # TypeScript 타입 정의
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   └── components/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
\`\`\`

**Structure Decision**: Web Application 구조 선택. Frontend(React/Vite)와 Backend(FastAPI)를 분리하여 독립적인 개발 및 배포가 가능하도록 구성.

## Complexity Tracking

> 현재 Constitution 위반 사항 없음. 표준 웹 애플리케이션 아키텍처 사용.
