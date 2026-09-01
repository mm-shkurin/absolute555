# All targets run from infra/. `docker compose` picks up ./docker-compose.yml
# and ./.env automatically.
.PHONY: up down build logs ps restart migrate shell psql clean test smoke

up:
	docker compose up -d --build

build:
	docker compose build

down:
	docker compose down

# Also drops the named volumes — postgres, redis, chroma and minio data.
clean:
	docker compose down -v

ps:
	docker compose ps

logs:
	docker compose logs -f --tail=100

restart:
	docker compose restart backend worker

migrate:
	docker compose exec backend alembic upgrade head

shell:
	docker compose exec backend sh

psql:
	docker compose exec postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

# The backend test suite, against the working tree.
#
# app/ and tests/ are mounted by the backend-test service in docker-compose.yml: the
# runtime image carries app/ as it was at its last build, and a run without the mount
# comes back green about code that is not the code on disk. Every run through stories 4
# and 5 added the mount by hand on the command line, which is the same as not having it.
#
# tests/ is not in the runtime image on purpose — it installs requirements.txt only — so
# the test dependencies are installed for the life of the container.
test:
	docker compose run --rm backend-test sh -c "pip install --no-cache-dir -q pytest==8.3.4 pytest-asyncio==0.25.0 'httpx==0.27.2' && python -m pytest"

# The stack is up and the API answers.
smoke:
	docker compose config -q
	curl -fsS http://localhost:$${BACKEND_HOST_PORT:-8000}/health
