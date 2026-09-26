# Technology Profile

tech-profile:
  backend: python-fastapi
  frontend: react-js
  css: css
  browser-testing: selenium

## Backend

| Concern | Technology |
|---------|-----------|
| Language | Python 3.12 |
| Framework | FastAPI 0.141 (Starlette 1.x) |
| Server | Uvicorn (uvloop on Linux) |
| Validation | Pydantic 2.x / pydantic-settings |
| Persistence | SQLAlchemy 2.0 (async, asyncpg) |
| Database | PostgreSQL 17 |
| Migrations | Alembic, run once per release by the `migrate` service |
| Cache | Redis 7 |
| Background jobs | ARQ (Redis queue), `worker` service on the backend image |
| Object storage | MinIO over the S3 API (boto3) |
| Auth | PyJWT; sign-in through Yandex and VK OAuth |
| OCR / images | pytesseract (tesseract, `rus`), opencv-python-headless, Pillow |
| Logging | loguru |
| Testing | pytest, pytest-asyncio, httpx, against real Postgres/Redis/MinIO |

## Frontend

| Concern | Technology |
|---------|-----------|
| Language | TypeScript (React 18) |
| Build tool | Vite |
| Routing | react-router-dom 7 |
| Server state | TanStack Query 5 |
| Styles | Plain CSS |
| Mobile | Capacitor 7 (Android) |
| Lint | oxlint + module-boundary and mock-parity scripts |
| Unit tests | Vitest + Testing Library |
| Browser tests | Selenium WebDriver under Vitest (`e2e/`), against a mock and against the live stack |
| Serving | nginx in the image, proxying `/api`, `/sse` and the chat WebSocket to the backend |

## Delivery

| Concern | Technology |
|---------|-----------|
| Containers | Docker, one compose file in `infra/` |
| CI/CD | GitHub Actions (`.github/workflows/README.md`) |
| Registry | GHCR, images tagged by commit sha |
| Image scanning | trivy, SBOM per image |
| Deploy | `infra/deploy.sh` over SSH on a single host; Kubernetes in progress (`.github/ci-cd-fixes.md`) |

## Conventions

- API prefix: `/api/v1/`
- URLs: kebab-case; files: snake_case (backend), camelCase/PascalCase (frontend)
- OpenAPI 3.0.3 YAML in `ProductSpecification/api-specs/`
