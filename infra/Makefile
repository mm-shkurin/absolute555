# All targets run from infra/. `docker compose` picks up ./docker-compose.yml
# and ./.env automatically.
.PHONY: up down build logs ps restart migrate shell psql clean test

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
	docker compose restart backend celery

migrate:
	docker compose exec backend alembic upgrade head

shell:
	docker compose exec backend sh

psql:
	docker compose exec postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

# Smoke check: the stack is up and the API answers.
test:
	docker compose config -q
	curl -fsS http://localhost:$${BACKEND_HOST_PORT:-8000}/health
