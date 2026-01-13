# Quickstart: AI 이미지 생성 및 편집 웹 서비스

## Prerequisites

- Python 3.11+
- Node.js 18+
- Git

## Backend Setup

```bash
# 1. 백엔드 디렉토리로 이동
cd backend

# 2. 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 의존성 설치
pip install -r requirements.txt

# 4. 환경 변수 설정
cp .env.example .env
# .env 파일 편집:
# - HUGGINGFACE_API_TOKEN=your_token_here
# - SECRET_KEY=your_secret_key_here

# 5. 데이터베이스 마이그레이션
alembic upgrade head

# 6. 개발 서버 실행
uvicorn src.main:app --reload --port 8000
```

## Frontend Setup

```bash
# 1. 프론트엔드 디렉토리로 이동
cd frontend

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일 편집:
# - VITE_API_URL=http://localhost:8000/api/v1

# 4. 개발 서버 실행
npm run dev
```

## Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## First Steps

1. 회원가입: 이메일과 비밀번호로 계정 생성
2. 로그인: 생성한 계정으로 로그인
3. 이미지 생성: 프롬프트 입력 후 "생성" 클릭
4. 갤러리 확인: 생성된 이미지 목록 확인
5. 다운로드: 이미지 다운로드 (48시간 내)

## Environment Variables

### Backend (.env)

```
# Database
DATABASE_URL=sqlite:///./app.db

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Hugging Face
HUGGINGFACE_API_TOKEN=hf_xxxxxxxxxxxxx

# Storage
STORAGE_PATH=./storage/images
IMAGE_RETENTION_HOURS=48

# Rate Limiting
DAILY_GENERATION_LIMIT=3
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:8000/api/v1
```

## Testing

### Backend

```bash
cd backend
pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm run test
```

## Common Issues

### HuggingFace API 오류

- API 토큰 확인
- 모델 접근 권한 확인
- 요청 제한 확인

### 이미지 생성 타임아웃

- 기본 타임아웃: 120초
- 고해상도 이미지는 더 오래 걸릴 수 있음

### CORS 오류

- backend의 CORS 설정 확인
- 프론트엔드 URL이 허용 목록에 있는지 확인
