# Architecture — deployable infra

Scope: `infra/docker-compose.yml` and the two images in `infra/docker/`. One compose
file serves local development, the CI stack run and the single production host. The
live public deploy is https://mmshkurin.ru; nothing in this repo provisions that host —
it is set up by hand per `infra/production-setup.md`.

## Topology

```
                     browser
            ┌───────────┴─────────────┐
            v                         v
  frontend (nginx, :80)          minio API (:9000, public photos)
   /       static bundle              ^
   /api/   ─┐                         │ S3 (boto3)
   /sse/   ─┼──> backend (uvicorn, :8000) ──> postgres (:5432)
   /api/v1/chat/ws ─┘        │              └> redis (:6379)
                             │
                  worker (arq, same image) ──> redis, postgres, minio

  one-shot:  migrate (alembic upgrade head)   minio-init (creates the bucket)
```

| Service | Image | Role |
|---|---|---|
| `postgres` | `postgres:17-alpine` | Primary database, volume `postgres_data` |
| `redis` | `redis:7-alpine` | Cache and the ARQ queue, AOF on, volume `redis_data` |
| `minio` | `quay.io/minio/minio`, pinned release | S3 storage for photos and documents, volume `minio_data` |
| `minio-init` | `quay.io/minio/mc`, pinned release | Creates `MINIO_BUCKET_NAME` and exits |
| `migrate` | backend image | `alembic upgrade head` once, then exits |
| `backend` | backend image | FastAPI; starts only after `migrate` succeeded |
| `worker` | backend image | `arq app.worker.WorkerSettings`: СТС OCR, VIN decode, expiring stale offers every 15 min |
| `frontend` | frontend image | nginx serving the Vite bundle and proxying to `backend` |
| `backend-test` | backend image, profile `test` | The pytest suite against the working tree (`make test`) |

No `container_name` anywhere and every host port is a variable, so several checkouts
can run side by side on one host (`docker compose -p <name>`).

## Ports

Only three things are published. Postgres, Redis and the MinIO console have no host
port in `docker-compose.yml`; `docker-compose.override.yml` (gitignored, copied from
`.example`) adds them for local work, and must not exist on the server.

| Service | Container port | Host port | Bound to |
|---|---|---|---|
| frontend | 80 | `FRONTEND_HOST_PORT` | all interfaces |
| minio (API) | 9000 | `MINIO_HOST_PORT` | all interfaces — the browser loads photos from it |
| backend | 8000 | `BACKEND_HOST_PORT` | `127.0.0.1` only — outside traffic goes through nginx |

## Configuration

Everything comes from `infra/.env`, copied from `infra/.env.example`; the same file is
passed to the backend, worker and migrate containers as `env_file`, and CI builds its
config from `.env.example` too, so a variable missing there fails in CI first.
`APP_TAG` (default `latest`) picks the image tag; on the server it is the commit sha.

## Images

- **`backend.Dockerfile`** — two stages. `deps` builds a venv with the compiler and
  `-dev` headers; the runtime stage is `python:3.12-slim` with tesseract (`rus`),
  poppler and the libs opencv needs, OS packages upgraded, runs as uid 10001. The only
  writable path besides `/tmp` is `/app/logs`. `CMD` is uvicorn; migrations are not part of startup.
- **`frontend.Dockerfile`** — `node:24-alpine` runs `npm ci && npm run build`;
  `nginx:alpine` serves `dist/` with `nginx/frontend.conf`: SPA fallback, `/api/`
  proxy, `/sse/` with buffering off, the chat WebSocket with Upgrade headers, 32 MB
  upload limit. `VITE_API_BASE_URL` is empty by default, i.e. same origin.

Both are built once per commit by the `images` workflow, scanned by trivy, and pushed
to `ghcr.io/mm-shkurin/absolute555/<name>:<sha>`.

## Deploy and rollback

`infra/deploy.sh <sha>` on the server: check out the sha, pull the images for it, run
`migrate`, `docker compose up -d`, wait for `/health`, and on failure call
`rollback.sh` with the previous sha. Rollback restarts the app services with
`--no-deps` and never runs migrations: the schema only moves forward, so a migration
must keep working with the previous release's code (add nullable, drop in a later
release). `backup.sh` dumps Postgres nightly from cron.

Known gaps — downtime during `up -d`, no staging, no external health probe — are
tracked in `.github/ci-cd-fixes.md` and closed by the move to Kubernetes.
