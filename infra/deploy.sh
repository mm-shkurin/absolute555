#!/usr/bin/env bash
# Развёртывание на сервере. Запускается НА сервере, из каталога infra:
#
#   ./deploy.sh            # обновиться до свежего main и перезапустить
#   ./deploy.sh v1.2.3     # развернуть конкретный тег или коммит
#
# Тот же порядок, который делается руками, но записанный: половина неудачных развёртываний
# случается не от плохого кода, а от забытого шага — не применили миграции, не пересобрали
# образ, не проверили, что оно вообще поднялось.
set -euo pipefail

REF="${1:-origin/main}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

if [[ ! -f .env ]]; then
  echo "Нет infra/.env. Скопируйте .env.example и заполните — без него compose не поднимется." >&2
  exit 1
fi

# Куда откатываться, если новая версия не встанет. Записывается ДО обновления: после
# `git checkout` эта информация уже недоступна.
PREVIOUS="$(git -C .. rev-parse HEAD)"
echo "Текущая версия: $PREVIOUS"

echo "== Обновление исходников до $REF =="
git -C .. fetch --all --tags --prune
git -C .. checkout --detach "$REF"
echo "Новая версия: $(git -C .. rev-parse HEAD)"

echo "== Сборка образов =="
docker compose build

echo "== Миграции =="
# Отдельным разовым контейнером, а не внутри работающего приложения: миграции должны
# закончиться до того, как новый код начнёт отвечать на запросы.
docker compose run --rm backend alembic upgrade head

echo "== Перезапуск =="
docker compose up -d

echo "== Проверка =="
PORT="$(grep -E '^BACKEND_HOST_PORT=' .env | cut -d= -f2)"
PORT="${PORT:-8000}"
for attempt in $(seq 1 30); do
  if curl -fsS "http://localhost:${PORT}/health" > /dev/null; then
    echo "Готово. Бэкенд отвечает на порту ${PORT}."
    exit 0
  fi
  sleep 3
done

echo "Бэкенд не ответил за 90 секунд. Откат:" >&2
echo "  git -C .. checkout --detach $PREVIOUS && ./deploy.sh $PREVIOUS" >&2
docker compose logs --no-color --tail=100 backend >&2
exit 1
