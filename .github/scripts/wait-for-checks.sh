#!/usr/bin/env bash
# Ждёт, пока прогоны по коммиту $SHA закончатся, и падает, если хоть один не зелёный.
#
# Ждём по sha, а не «последний прогон ветки»: пока идёт релиз, в main может прилететь
# следующий коммит, и ветка будет рассказывать уже про него.
#
# Прогона может не быть вовсе — backend не запускается на правку одного фронтенда. На
# регистрацию отведены полторы минуты, после которых отсутствие считается отсутствием,
# а не задержкой: иначе релиз ждал бы прогона, которого никто не собирался запускать.
set -euo pipefail

REQUIRED="${REQUIRED:-backend frontend rules stack}"
TIMEOUT_MINUTES="${TIMEOUT_MINUTES:-55}"

deadline=$(( $(date +%s) + TIMEOUT_MINUTES * 60 ))
grace=$(( $(date +%s) + 90 ))

while :; do
  runs="$(gh api "repos/$REPO/actions/runs?head_sha=$SHA&per_page=100" \
    --jq '.workflow_runs[] | "\(.name)|\(.status)|\(.conclusion)"')"
  pending=""
  for wf in $REQUIRED; do
    line="$(printf '%s\n' "$runs" | grep "^$wf|" | head -1 || true)"
    if [ -z "$line" ]; then
      if [ "$(date +%s)" -lt "$grace" ]; then pending="$pending $wf"; fi
      continue
    fi
    status="$(printf '%s' "$line" | cut -d'|' -f2)"
    conclusion="$(printf '%s' "$line" | cut -d'|' -f3)"
    if [ "$status" != "completed" ]; then pending="$pending $wf"; continue; fi
    case "$conclusion" in
      success|skipped) ;;
      *) echo "Прогон $wf завершился как $conclusion — развёртывания не будет." >&2; exit 1 ;;
    esac
  done
  if [ -z "$pending" ]; then echo "Все проверки по $SHA зелёные."; exit 0; fi
  if [ "$(date +%s)" -ge "$deadline" ]; then echo "Не дождались:$pending" >&2; exit 1; fi
  echo "Ждём:$pending"
  sleep 30
done
