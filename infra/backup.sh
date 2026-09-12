#!/usr/bin/env bash
# Снимок базы. Запускается НА сервере, из каталога infra:
#
#   ./backup.sh              # дамп в backups/, старше 14 дней — удаляются
#   KEEP_DAYS=30 ./backup.sh # другой срок хранения
#
# Ставится в cron рядом с развёртыванием, а не вместо него:
#
#   0 3 * * * cd /srv/absolute555/infra && ./backup.sh >> /var/log/absolute-backup.log 2>&1
#
# Развёртывание применяет миграции, а неудачная миграция — это не упавший контейнер, а
# изменённые данные: откатить её нечем. Поэтому снимок должен существовать до того, как
# он понадобится, а не сниматься в панике вместе с попыткой починить.
#
# Каталог backups/ гитигнорен: в дампе персональные данные пользователей.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

KEEP_DAYS="${KEEP_DAYS:-14}"
OUT="backups"
mkdir -p "$OUT"

# Учётные данные берутся из того же .env, что читает compose: второй список разошёлся бы
# с первым молча и обнаружился бы при восстановлении.
set -a; . ./.env; set +a

STAMP="$(date -u +%Y%m%d-%H%M%S)"
FILE="$OUT/${POSTGRES_DB}-${STAMP}.sql.gz"

echo "== Дамп $POSTGRES_DB в $FILE =="
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILE"

# Пустой дамп — это не бэкап, а файл. Ловится здесь, а не при восстановлении.
SIZE="$(wc -c < "$FILE")"
if [ "$SIZE" -lt 1000 ]; then
  echo "Дамп подозрительно мал ($SIZE байт) — не считаю его снимком." >&2
  rm -f "$FILE"
  exit 1
fi

echo "Готово: $FILE ($SIZE байт)"

echo "== Чистка старше $KEEP_DAYS дней =="
find "$OUT" -name '*.sql.gz' -type f -mtime "+$KEEP_DAYS" -print -delete

# Восстановление — обратная команда, записана здесь, чтобы не вспоминать её под давлением:
#   gunzip -c backups/<файл>.sql.gz | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
