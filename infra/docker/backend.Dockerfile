# Backend image: FastAPI app + Alembic migrations.
# Build context is the repo root (see docker-compose.yml `backend.build.context: ..`)
# so this Dockerfile can COPY backend/.

# Dependencies are installed into a venv in a throwaway stage: the compiler and -dev
# headers a source build may need never reach the image that runs in production.
FROM python:3.12-slim AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
      gcc \
      pkg-config \
      libtesseract-dev \
      libleptonica-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt


FROM python:3.12-slim

# OCR (pytesseract + Russian traineddata), PDF tooling (poppler) and the shared
# libs opencv-python-headless links against.
RUN apt-get update && apt-get install -y --no-install-recommends \
      tesseract-ocr \
      tesseract-ocr-rus \
      poppler-utils \
      libglib2.0-0 \
      libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# A fixed uid, so a Kubernetes securityContext (runAsNonRoot) can check it by number.
RUN useradd --uid 10001 --no-create-home --shell /usr/sbin/nologin app

COPY --from=deps /opt/venv /opt/venv

WORKDIR /app
COPY backend/alembic alembic
COPY backend/alembic.ini alembic.ini
COPY backend/app app
# The only path the app writes to: loguru's file sink (AppSettings.log_file).
RUN mkdir logs && chown 10001 logs

ENV PATH=/opt/venv/bin:$PATH
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

USER 10001

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --retries=5 --start-period=20s \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=2)" || exit 1

# Migrations are not part of startup: they run once per release as their own container
# (the compose `migrate` service), not once per replica.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
