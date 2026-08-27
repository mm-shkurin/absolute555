# Backend image: FastAPI app + Alembic migrations.
# Build context is the repo root (see docker-compose.yml `backend.build.context: ..`)
# so this Dockerfile can COPY backend/.
FROM python:3.12-slim

# OCR (pytesseract + Russian traineddata), PDF tooling (poppler) and the shared
# libs opencv-python-headless links against. Installed before pip so the wheels
# find them at import time.
RUN apt-get update && apt-get install -y --no-install-recommends \
      gcc \
      pkg-config \
      postgresql-client \
      tesseract-ocr \
      tesseract-ocr-rus \
      libtesseract-dev \
      libleptonica-dev \
      poppler-utils \
      libglib2.0-0 \
      libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/alembic alembic
COPY backend/alembic.ini alembic.ini
COPY backend/app app

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --retries=5 --start-period=20s \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=2)" || exit 1

# Migrations run in the entrypoint, not here, so the celery worker can reuse
# this image without re-running `alembic upgrade head`.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
