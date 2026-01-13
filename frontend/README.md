# ImagePlayground Frontend

React + TypeScript 기반 AI 이미지 생성 서비스 프론트엔드

## 기술 스택

- **Framework**: React 18
- **Language**: TypeScript 5.x
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Routing**: React Router v6
- **Canvas**: Konva.js / react-konva
- **Testing**: Vitest + Testing Library

## 프로젝트 구조

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/       # 공통 컴포넌트
│   │   ├── generation/   # 이미지 생성 관련
│   │   ├── gallery/      # 갤러리 관련
│   │   └── canvas/       # 캔버스/마스킹 관련
│   ├── pages/            # 페이지 컴포넌트
│   ├── hooks/            # 커스텀 훅
│   ├── stores/           # Zustand 스토어
│   ├── services/         # API 서비스
│   ├── types/            # TypeScript 타입
│   ├── test/             # 테스트 유틸리티
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 설치 및 실행

### 요구사항

- Node.js 18+
- npm 또는 yarn

### 설치

```bash
npm install
```

### 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일:
```env
VITE_API_URL=http://localhost:8000
```

### 실행

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### Docker 실행

```bash
docker build -t imageplayground-frontend .
docker run -p 5173:5173 imageplayground-frontend
```

## 주요 페이지

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | Home | 이미지 생성 메인 페이지 |
| `/login` | Login | 로그인 |
| `/register` | Register | 회원가입 |
| `/gallery` | Gallery | 생성된 이미지 갤러리 |
| `/admin` | Admin | 관리자 페이지 |

## 스크립트

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 린트 검사
npm run lint

# 테스트 실행
npm test

# 테스트 UI
npm run test:ui

# 테스트 커버리지
npm run test:coverage
```

## 컴포넌트 구조

### 이미지 생성 플로우
```
HomePage
├── GenerationModeSelector (text2img/img2img/inpaint)
├── PromptInput (메인/네거티브 프롬프트)
├── ParameterPanel (비율, 시드, 스텝)
├── ImageUploader (img2img/inpaint용)
├── MaskCanvas (inpaint용 마스킹)
├── GenerateButton
├── JobStatusIndicator
└── ImagePreview
```

### 갤러리
```
GalleryPage
├── GalleryGrid
│   └── GalleryCard
├── ImageDetailModal
├── ReuseParametersButton
└── Pagination
```

## 상태 관리

### Zustand Stores

- **authStore**: 인증 상태 (user, tokens)
- **generationStore**: 생성 파라미터 상태
- **canvasStore**: 캔버스/마스킹 상태

### TanStack Query

- 서버 상태 관리 (jobs, images, user data)
- 자동 캐싱 및 재검증
- 폴링 (작업 상태 확인)

## 라이선스

MIT License
