#!/usr/bin/env bash
# Возврат на предыдущую версию. Запускается НА сервере, из каталога infra:
#
#   ./rollback.sh <sha>    # вернуться на этот коммит
#
# Вызывается сам из deploy.sh, когда новая версия не ответила на /health, и руками —
# когда версия поднялась, но ведёт себя не так.
#
# Откатывается КОД, а не схема. `alembic downgrade` на проде теряет данные, и решение
# об этом принимает человек, глядя на конкретную ревизию, а не скрипт в три часа ночи.
# Отсюда требование к миграциям: новая схема обязана работать со старым кодом —
# столбец добавляется nullable, удаляется отдельным релизом после того, как код
# перестал его читать. Иначе откат кода упирается в схему, которая ушла вперёд.
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Нужен коммит, на который возвращаемся: ./rollback.sh <sha>" >&2
  exit 2
fi

TARGET="$1"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

echo "== Возврат на $TARGET =="
git -C .. checkout --detach "$TARGET"

APP_TAG="$(git -C .. rev-parse HEAD)"
export APP_TAG
if [[ -n "${GHCR_USER:-}" && -n "${GHCR_TOKEN:-}" ]]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
fi
docker compose pull backend worker frontend
docker compose up -d

PORT="$(grep -E '^BACKEND_HOST_PORT=' .env | cut -d= -f2)"
PORT="${PORT:-8000}"
for attempt in $(seq 1 30); do
  if curl -fsS "http://localhost:${PORT}/health" > /dev/null; then
    echo "Откат выполнен, бэкенд отвечает. Версия: $APP_TAG"
    exit 0
  fi
  sleep 3
done

# Предыдущая версия тоже не поднялась — значит дело не в коде: база, диск, сеть,
# переменные окружения. Дальше автоматика только навредит.
echo "После отката бэкенд тоже не отвечает. Причина не в развёрнутой версии." >&2
docker compose logs --no-color --tail=100 >&2
exit 1
