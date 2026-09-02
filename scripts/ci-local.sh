#!/usr/bin/env bash
# Локальный прогон того же, что делает CI (.github/workflows/backend.yml, frontend.yml).
# Одна команда перед пушем: bash scripts/ci-local.sh
#
# Postgres поднимается одноразовым контейнером на свободном порту, а не берётся из
# infra/docker-compose.yml: прогон не должен трогать базу, в которой лежит рабочее
# состояние разработчика.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_BACKEND=1
RUN_FRONTEND=1
RUN_E2E=1
RUN_IMAGES=0
# Быстрый круг: стек живёт между прогонами, поэтому имена постоянные, а не по PID.
FAST=0
SUITE=""
PG_PORT="${PG_PORT:-55432}"
STACK="$$"
PG_CONTAINER="absolute555-ci-pg-$STACK"
REDIS_CONTAINER="absolute555-ci-redis-$STACK"
MINIO_CONTAINER="absolute555-ci-minio-$STACK"
CI_NETWORK="absolute555-ci-net-$STACK"
BACKEND_IMAGE="absolute555-backend:ci-local"
TEST_IMAGE="absolute555-backend:ci-local-tests"
COVERAGE=0
FAILED=()
RESULTS=()
STARTED_AT=$SECONDS

for arg in "$@"; do
  case "$arg" in
    --backend)  RUN_FRONTEND=0 ;;
    --frontend) RUN_BACKEND=0 ;;
    --no-e2e)   RUN_E2E=0 ;;
    --images)   RUN_IMAGES=1 ;;
    --fast)     FAST=1; RUN_FRONTEND=0 ;;
    --coverage) COVERAGE=1; FAST=1; RUN_FRONTEND=0 ;;
    --scope=*)  ;;
    tests/*)    SUITE="$SUITE $arg" ;;
    -h|--help)
      echo "usage: bash scripts/ci-local.sh [--backend|--frontend] [--no-e2e] [--images]"
      echo "       bash scripts/ci-local.sh --fast [tests/test_x.py ...]"
      echo ""
      echo "       bash scripts/ci-local.sh --coverage [tests/test_x.py ...]"
      echo ""
      echo "  --fast      круг по коду: стек и образы переиспользуются, миграции и справочник"
      echo "              пропускаются, если база уже готова. Перед пушем — полный прогон."
      echo "  --coverage  тот же круг с замером покрытия. Отдельная цель, потому что мерить"
      echo "              покрытие в каждом прогоне — платить временем за цифру, которая"
      echo "              нужна изредка."
      exit 0 ;;
    *) echo "неизвестный аргумент: $arg" >&2; exit 2 ;;
  esac
done

# Цвет только в терминал: в файле или в конвейере ANSI-коды превращаются в мусор,
# который потом ищут глазами в логе. NO_COLOR отключает вручную.
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_OK=$'[32m'; C_FAIL=$'[31m'; C_STEP=$'[1;36m'; C_OFF=$'[0m'
else
  C_OK=""; C_FAIL=""; C_STEP=""; C_OFF=""
fi

step() {
  local name="$1"; shift
  local started=$SECONDS
  echo ""
  echo "${C_STEP}${name}${C_OFF}"
  if "$@"; then
    echo "${C_OK}ok${C_OFF}  ${name}"
    RESULTS+=("ok|$((SECONDS - started))|$name")
  else
    echo "${C_FAIL}fail${C_OFF}  ${name}"
    RESULTS+=("fail|$((SECONDS - started))|$name")
    FAILED+=("$name")
  fi
}

fmt_time() {
  printf '%dм %02dс' $(($1 / 60)) $(($1 % 60))
}

cleanup() {
  # В быстром круге стек намеренно остаётся жить: подъём Postgres, Redis и MinIO — это
  # и есть основное время такого прогона.
  if [ "$FAST" = 1 ]; then
    if [ -n "${ENV_BACKUP:-}" ] && [ -f "$ENV_BACKUP" ]; then
      mv -f "$ENV_BACKUP" "$ROOT/backend/.env"
    fi
    return 0
  fi
  if [ -n "${PG_STARTED:-}" ]; then
    docker rm -f "$PG_CONTAINER" "$REDIS_CONTAINER" "$MINIO_CONTAINER" >/dev/null 2>&1 || true
  fi
  if [ -n "${NET_STARTED:-}" ]; then
    docker network rm "$CI_NETWORK" >/dev/null 2>&1 || true
  fi
  if [ -n "${ENV_BACKUP:-}" ] && [ -f "$ENV_BACKUP" ]; then
    mv -f "$ENV_BACKUP" "$ROOT/backend/.env"
  elif [ -n "${ENV_WRITTEN:-}" ]; then
    rm -f "$ROOT/backend/.env"
  fi
}
trap cleanup EXIT

# Docker под Windows не понимает пути вида /c/Users/... , которые даёт MSYS.
to_docker_path() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else printf '%s' "$1"; fi
}

write_backend_env() {
  if [ -f "$ROOT/backend/.env" ]; then
    ENV_BACKUP="$ROOT/backend/.env.ci-local.bak"
    cp -f "$ROOT/backend/.env" "$ENV_BACKUP"
  fi
  ENV_WRITTEN=1
  cp "$ROOT/infra/.env.example" "$ROOT/backend/.env"
  {
    echo "POSTGRES_HOST=$PG_CONTAINER"
    echo "POSTGRES_PORT=5432"
    echo "POSTGRES_USER=absolute"
    echo "POSTGRES_PASSWORD=absolute"
    echo "POSTGRES_DB=absolute"
    echo "SECRET_KEY=ci-secret-key-not-used-anywhere-else-0000"
    echo "REFRESH_TOKEN_SECRET_KEY=ci-refresh-secret-not-used-elsewhere-00"
    echo "YANDEX_CLIENTID=ci-yandex-client-id-placeholder-000000000"
    echo "YANDEX_CLIENT_SECRET=ci-yandex-client-secret-placeholder-0000"
    echo "VK_CLIENT_ID=ci-vk-client-id"
    echo "VK_CLIENT_SECRET=ci-vk-client-secret"
    echo "GIGA_AUTH_KEY=ci-giga-auth-key"
    echo "GIGA_CLIENT_ID=ci-giga-client-id"
    # Пустые: redis в прогоне поднимается без пароля, а заполненные учётные данные
    # заставили бы клиент здороваться AUTH и получать отказ.
    echo "REDIS_HOST=$REDIS_CONTAINER"
    echo "REDIS_NETWORK_NAME=$REDIS_CONTAINER"
    echo "REDIS_PORT=6379"
    echo "REDIS_PASSWORD="
    echo "REDIS_USER="
    echo "REDIS_USER_PASSWORD="
    echo "MINIO_NETWORK_NAME=$MINIO_CONTAINER"
    echo "MINIO_ENDPOINT_URL=http://$MINIO_CONTAINER:9000"
    echo "MINIO_ROOT_USER=minioadmin"
    echo "MINIO_ROOT_PASSWORD=minioadmin"
    echo "MINIO_BUCKET_NAME=absolute"
    echo "MINIO_DOCUMENTS_BUCKET=absolute-documents"
    echo "PUBLIC_PHOTO_BASE_URL=http://localhost:9000/absolute"
  } >> "$ROOT/backend/.env"
}

# Пути для docker под Windows. MSYS переписывает всё, что похоже на путь, и портит и
# -v, и --env-file, и контекст сборки; поэтому переписывание глушится на время вызова, а
# путь заранее переводится в вид, который понимает Docker Desktop. На Linux и macOS
# cygpath отсутствует и обе функции сводятся к прямому вызову docker.
to_docker_path() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else printf '%s' "$1"; fi
}

docker_run() {
  MSYS_NO_PATHCONV=1 docker "$@"
}

build_backend_image() {
  docker_run build -q \
    -f "$(to_docker_path "$ROOT/infra/docker/backend.Dockerfile")" \
    -t "$BACKEND_IMAGE" "$(to_docker_path "$ROOT")" >/dev/null
}

# Собирается из stdin: отдельный Dockerfile ради трёх строк, которые нужны только
# локальному прогону, пришлось бы держать в репозитории и объяснять.
build_test_image() {
  printf '%s\n' \
    "FROM $BACKEND_IMAGE" \
    "COPY requirements.txt requirements-dev.txt ./" \
    "RUN pip install --no-cache-dir -r requirements-dev.txt" \
    | docker_run build -q -f - -t "$TEST_IMAGE" "$(to_docker_path "$ROOT/backend")" >/dev/null
}

# Каталог монтируется поверх /app: тесты и alembic в рантайм-образ не входят, а код в
# нём — тот, что был при сборке, а не тот, что в рабочем дереве.
run_in_backend() {
  docker_run run --rm --network "$CI_NETWORK" \
    -v "$(to_docker_path "$ROOT/backend")":/app \
    -e POSTGRES_HOST="$PG_CONTAINER" -e POSTGRES_PORT=5432 \
    --env-file "$(to_docker_path "$ROOT/backend/.env")" \
    "$TEST_IMAGE" sh -c "$1"
}

# Postgres, Redis и MinIO поднимаются одноразовыми контейнерами, а не берутся из
# infra/docker-compose.yml: прогон не должен трогать базу и бакеты, в которых лежит
# рабочее состояние разработчика.
# Стек уже поднят и отвечает?
stack_is_up() {
  docker exec "$PG_CONTAINER" pg_isready -U absolute >/dev/null 2>&1 \
    && docker exec "$REDIS_CONTAINER" redis-cli ping >/dev/null 2>&1
}

start_services() {
  if [ "$FAST" = 1 ] && stack_is_up; then
    echo "стек уже поднят — переиспользую"
    PG_STARTED=1
    return 0
  fi

  docker rm -f "$PG_CONTAINER" "$REDIS_CONTAINER" "$MINIO_CONTAINER" >/dev/null 2>&1 || true
  docker network create "$CI_NETWORK" >/dev/null 2>&1 && NET_STARTED=1
  PG_STARTED=1

  # Порт наружу — только у одноразового стека. Постоянный держал бы его между прогонами,
  # и полный прогон падал бы на занятом порту, ничего не сказав про код.
  PUBLISH=""
  [ "$FAST" = 0 ] && PUBLISH="-p $PG_PORT:5432"

  docker_run run -d --name "$PG_CONTAINER" --network "$CI_NETWORK" \
    -e POSTGRES_USER=absolute -e POSTGRES_PASSWORD=absolute -e POSTGRES_DB=absolute \
    $PUBLISH postgres:16-alpine >/dev/null || return 1

  # Без пароля: приложение читает учётные данные из окружения, и пустые значения там
  # означают ровно это соединение.
  docker_run run -d --name "$REDIS_CONTAINER" --network "$CI_NETWORK" \
    redis:7-alpine >/dev/null || return 1

  docker_run run -d --name "$MINIO_CONTAINER" --network "$CI_NETWORK" \
    -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
    minio/minio:latest server /data >/dev/null || return 1

  # Тот же health-gate, что в workflow: без него первый запрос уходит в ещё
  # поднимающуюся базу и прогон краснеет на connection refused.
  for _ in $(seq 1 30); do
    if docker exec "$PG_CONTAINER" pg_isready -U absolute >/dev/null 2>&1 \
       && docker exec "$REDIS_CONTAINER" redis-cli ping >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "postgres или redis не поднялись за 60 секунд" >&2
  return 1
}

# Гейты из прогона `rules`: чтение исходников, зависимость одна — pyyaml. Идут первыми,
# потому что стоят минуту и ловят то, что дороже всего чинить после пуша.
rules() {
  # Полосе — её собственные правила: прогон, всегда красный по чужой причине, перестают
  # читать. Общий прогон в CI по-прежнему берёт обе.
  local scope=""
  [ "$RUN_FRONTEND" = 0 ] && scope="--scope back"
  [ "$RUN_BACKEND" = 0 ] && scope="--scope front"

  step "правила репозитория" python "$ROOT/scripts/check_repo_rules.py" $scope
  step "контракт API"        python "$ROOT/scripts/check_api_contract.py"
  step "типы фронтенда"      python "$ROOT/scripts/check_contract_types.py"
}

# Сборка образов из прогонов backend/frontend. Без кэша GHA локально это минуты, поэтому
# за флагом --images, а не по умолчанию.
images() {
  step "образ backend"  build_backend_image
  step "образ frontend" docker_run build -q \
    -f "$(to_docker_path "$ROOT/infra/docker/frontend.Dockerfile")" \
    -t absolute555-frontend:ci-local "$(to_docker_path "$ROOT")"
}

# Бэкенд идёт в контейнере из того же Dockerfile, что едет в прод, а не в хостовом
# Python. Дело не в чистоте: половина зависимостей — колёса под Linux, и на Windows
# установка падает на uvloop, то есть локальный прогон бэкенда там был невозможен.
# Контейнер заодно даёт ту же версию Python и те же системные библиотеки, что в CI.
# Бэкенд идёт в контейнере из того же Dockerfile, что едет в прод, а не в хостовом
# Python: половина зависимостей — колёса под Linux, и на Windows установка падает на
# uvloop, то есть локальный прогон бэкенда там был невозможен. Контейнер заодно даёт ту
# же версию Python и те же системные библиотеки, что в CI.
# Каталог уже залит? Тогда второй заливки не нужно: сидер идемпотентен, но стоит
# восемь секунд на каждом круге.
catalogue_is_seeded() {
  docker exec "$PG_CONTAINER" psql -U absolute -d absolute -tAc \
    "SELECT 1 FROM brands LIMIT 1" 2>/dev/null | grep -q 1
}

backend_fast() {
  command -v docker >/dev/null 2>&1 || { echo "нужен docker" >&2; return 1; }
  start_services || return 1
  write_backend_env

  docker image inspect "$TEST_IMAGE" >/dev/null 2>&1 || {
    step "backend: образ"        build_backend_image
    step "backend: образ тестов" build_test_image
  }

  step "backend: миграции" run_in_backend "alembic upgrade head"
  if ! catalogue_is_seeded; then
    step "backend: справочник" run_in_backend "python -m app.data.seed_catalog"
  fi

  # Без отката ревизии и без гейтов правил: круг по коду отвечает на один вопрос —
  # проходят ли тесты. Всё остальное спрашивается полным прогоном перед пушем.
  if [ "$COVERAGE" = "1" ]; then
    step "backend: покрытие" run_in_backend       "python -m pytest ${SUITE:-} -q --cov=app --cov-report=term-missing:skip-covered --cov-report=xml:coverage.xml"
    return
  fi

  step "backend: тесты" run_in_backend "python -m pytest ${SUITE:-} -x -q"
}

backend() {
  command -v docker >/dev/null 2>&1 || { echo "нужен docker" >&2; return 1; }
  start_services || return 1
  write_backend_env

  step "backend: образ"        build_backend_image
  # Тестовые зависимости ставятся на сборке, а не на каждом шаге прогона: иначе это
  # минута ожидания трижды и ещё одна причина покраснеть, никак не связанная с кодом.
  # Рантайм-образ их не несёт намеренно — он ставит только requirements.txt.
  step "backend: образ тестов" build_test_image

  step "backend: миграции"      run_in_backend "alembic upgrade head"
  # Каталог марок — данные, без которых не проходит проверка полноты объявления: тесты,
  # доводящие объявление до модерации, требуют существующей марки и модели.
  step "backend: справочник"    run_in_backend "python -m app.data.seed_catalog"
  # Шаг назад и снова вперёд — как в workflow: ревизия без работающего downgrade
  # выглядит здоровой ровно до дня, когда релиз надо откатить.
  step "backend: откат ревизии" run_in_backend "alembic downgrade -1 && alembic upgrade head"
  step "backend: тесты"         run_in_backend "python -m pytest"
}

# npm ci стирает node_modules целиком, и на Windows это регулярно упирается в EPERM:
# файл .node держит антивирус, OneDrive или ещё живой vite. Поэтому переустановка
# делается только когда её действительно не хватает, а при отказе есть запасной путь.
frontend_deps() {
  cd "$ROOT/frontend" || return 1
  if [ -d node_modules ] && [ node_modules/.package-lock.json -nt package-lock.json ]; then
    echo "зависимости на месте, переустановка не нужна"
    return 0
  fi
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
}

frontend() {
  step "frontend: зависимости" frontend_deps || return 1
  step "frontend: типы"            bash -c "cd '$ROOT/frontend' && npm run typecheck"
  step "frontend: правила"         bash -c "cd '$ROOT/frontend' && npm run lint"
  step "frontend: юниты"           bash -c "cd '$ROOT/frontend' && npx vitest run"
  step "frontend: сборка"          bash -c "cd '$ROOT/frontend' && npm run build"
  if [ "$RUN_E2E" = 1 ]; then
    step "frontend: браузер" bash -c "cd '$ROOT/frontend' && CI=true npm run test:e2e"
  fi
}

if [ "$FAST" = 1 ]; then
  STACK="fast"
  PG_CONTAINER="absolute555-ci-pg-fast"
  REDIS_CONTAINER="absolute555-ci-redis-fast"
  MINIO_CONTAINER="absolute555-ci-minio-fast"
  CI_NETWORK="absolute555-ci-net-fast"
  backend_fast || FAILED+=("backend: подготовка")
else
rules
[ "$RUN_BACKEND" = 1 ]  && { backend  || FAILED+=("backend: подготовка"); }
[ "$RUN_FRONTEND" = 1 ] && { frontend || FAILED+=("frontend: подготовка"); }
[ "$RUN_IMAGES" = 1 ]   && images
fi

echo ""
echo "${C_STEP}итог${C_OFF}"
if [ ${#RESULTS[@]} -gt 0 ]; then
  for entry in "${RESULTS[@]}"; do
    status="${entry%%|*}"; rest="${entry#*|}"
    # Имя шага в конце строки, а не в колонке фиксированной ширины: printf меряет
    # ширину в байтах, и кириллица разъезжается.
    printf '  %s  %8s  %s
'       "$([ "$status" = ok ] && echo "${C_OK}ok  ${C_OFF}" || echo "${C_FAIL}fail${C_OFF}")"       "$(fmt_time "${rest%%|*}")" "${rest#*|}"
  done
fi
printf '  шагов: %d, красных: %d, всего: %s
'   "${#RESULTS[@]}" "${#FAILED[@]}" "$(fmt_time $((SECONDS - STARTED_AT)))"

echo ""
if [ ${#FAILED[@]} -eq 0 ]; then
  if [ "$FAST" = 1 ]; then
    # Быстрый круг не спрашивал про правила, контракт и откат ревизии — сказать «можно
    # пушить» здесь значило бы выдать ответ на вопрос, который не задавали.
    echo "${C_OK}Тесты зелёные. Перед пушем — полный прогон.${C_OFF}"
  else
    echo "${C_OK}CI локально зелёный — можно пушить.${C_OFF}"
  fi
  exit 0
fi
echo "${C_FAIL}красное: ${FAILED[*]}${C_OFF}"
exit 1
