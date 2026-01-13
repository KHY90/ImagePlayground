# ImagePlayground

AI 기반 이미지 생성 및 편집 웹 서비스

## 소개

ImagePlayground는 HuggingFace의 AI 모델을 활용하여 텍스트로부터 이미지를 생성하고, 기존 이미지를 편집할 수 있는 웹 서비스입니다.

### 주요 기능

- **Text-to-Image**: 텍스트 프롬프트로 이미지 생성
- **Image-to-Image**: 기존 이미지를 기반으로 새로운 이미지 생성
- **Inpainting**: 이미지의 특정 영역을 마스킹하여 편집
- **Gallery**: 생성된 이미지 히스토리 관리
- **사용량 제한**: 일일 생성 횟수 제한 기능

## 기술 스택

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy + SQLite (개발) / PostgreSQL (프로덕션)
- HuggingFace Hub
- JWT 인증

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- TanStack Query
- Zustand
- Konva.js (캔버스)

## 프로젝트 구조

```
ImagePlayground/
├── backend/          # FastAPI 백엔드 서버
├── frontend/         # React 프론트엔드
├── docker-compose.yml
└── README.md
```

## 빠른 시작

### Docker Compose 사용 (권장)

```bash
# 개발 서버 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### 수동 설치

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
# .env 파일에서 HUGGINGFACE_API_TOKEN 설정
uvicorn src.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 환경 변수

### Backend (.env)
```
HUGGINGFACE_API_TOKEN=your-token-here
JWT_SECRET_KEY=your-secret-key
DATABASE_URL=sqlite+aiosqlite:///./data/app.db
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## API 문서

API 문서는 서버 실행 후 다음 URL에서 확인할 수 있습니다:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 개발

### 테스트 실행

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### 린트 실행

```bash
# Backend
cd backend
ruff check .

# Frontend
cd frontend
npm run lint
```

## 라이선스

MIT License
