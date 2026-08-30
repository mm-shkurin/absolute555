# Technology Profile

tech-profile:
  backend: python-fastapi
  frontend: react-js
  css: sass
  browser-testing: none

## Backend

| Concern | Technology |
|---------|-----------|
| Language | Python 3.11+ |
| Framework | FastAPI 0.104 |
| Server | Uvicorn (uvloop) |
| Validation | Pydantic 2.x / pydantic-settings |
| Persistence | SQLAlchemy 2.0 (async, asyncpg) + GeoAlchemy2 |
| Database | PostgreSQL (+PostGIS) |
| Migrations | Alembic |
| Cache / broker | Redis, RabbitMQ (amqp) |
| Background jobs | ARQ |
| Object storage | MinIO / boto3 (S3) |
| Auth | PyJWT, argon2/bcrypt, fastapi-sso, PKCE |
| AI / vectors | ChromaDB, GigaChat, HuggingFace tokenizers, onnxruntime |
| OCR / images | pytesseract, opencv-python-headless, Pillow |
| Logging | loguru |
| Telemetry | OpenTelemetry (OTLP gRPC) |
| Packaging | Docker, docker-compose |

## Frontend

| Concern | Technology |
|---------|-----------|
| Language | JavaScript (React 19) |
| Build tool | react-scripts (CRA 5) |
| Routing | react-router-dom 7 |
| HTTP | axios |
| Styles | Sass |
| Charts | recharts |
| Mobile | Capacitor 7 (Android) |
| Testing | Testing Library (React / DOM / user-event) + Jest |
| Serving | nginx, proxy-server.js (Express) |

## Conventions

- API prefix: `/api/v1/`
- URLs: kebab-case; files: snake_case (backend), camelCase/PascalCase (frontend)
- OpenAPI 3.0.3 YAML in `ProductSpecification/api-specs/`
