# ImagePlayground Backend

FastAPI 기반 AI 이미지 생성 서비스 백엔드

## 기술 스택

- **Framework**: FastAPI
- **Database**: SQLAlchemy + SQLite/PostgreSQL
- **Authentication**: JWT (python-jose)
- **AI Integration**: HuggingFace Hub
- **Image Processing**: Pillow
- **Testing**: pytest + pytest-asyncio

## 프로젝트 구조

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/       # API 엔드포인트
│   │   └── deps.py       # 의존성 주입
│   ├── core/
│   │   ├── config.py     # 설정 관리
│   │   ├── database.py   # DB 연결
│   │   └── security.py   # JWT, 비밀번호 해싱
│   ├── models/           # SQLAlchemy 모델
│   ├── schemas/          # Pydantic 스키마
│   ├── services/         # 비즈니스 로직
│   └── main.py           # FastAPI 앱 진입점
├── tests/
│   ├── unit/
│   └── integration/
├── alembic/              # DB 마이그레이션
├── pyproject.toml
├── requirements.txt
└── requirements-dev.txt
```

## 설치 및 실행

### 요구사항

- Python 3.11+
- pip

### 설치

```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 의존성 설치
pip install -r requirements-dev.txt
```

### 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 다음 값들을 설정:

```env
# 필수 설정
HUGGINGFACE_API_TOKEN=your-huggingface-api-token
JWT_SECRET_KEY=your-secure-secret-key

# 선택 설정
DATABASE_URL=sqlite+aiosqlite:///./data/app.db
DEBUG=true
```

### 실행

```bash
# 개발 서버 실행
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker 실행

```bash
docker build -t imageplayground-backend .
docker run -p 8000:8000 --env-file .env imageplayground-backend
```

## API 엔드포인트

### 인증 (Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/refresh` | 토큰 갱신 |
| GET | `/api/auth/me` | 현재 사용자 정보 |

### 작업 (Jobs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | 이미지 생성 작업 생성 |
| GET | `/api/jobs` | 작업 목록 조회 |
| GET | `/api/jobs/{id}` | 작업 상세 조회 |

### 이미지 (Images)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/images` | 갤러리 목록 |
| GET | `/api/images/{id}` | 이미지 상세 |
| GET | `/api/images/{id}/download` | 이미지 다운로드 |

## 테스트

```bash
# 전체 테스트 실행
pytest

# 커버리지 포함
pytest --cov=src --cov-report=html

# 특정 테스트 실행
pytest tests/unit/test_auth.py -v
```

## 코드 품질

```bash
# 린트 검사
ruff check .

# 린트 자동 수정
ruff check . --fix

# 타입 검사
mypy src/
```

## 데이터베이스 마이그레이션

```bash
# 마이그레이션 생성
alembic revision --autogenerate -m "description"

# 마이그레이션 실행
alembic upgrade head

# 롤백
alembic downgrade -1
```

## 라이선스

MIT License
