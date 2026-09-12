#!/usr/bin/env bash
# Отмечает тегом и релизом то, что реально встало на сервер.
#
# Без этого «предыдущая версия» восстанавливается раскопками в логах прогона — в тот
# момент, когда прод лежит и время дорого. Тег ставится после успешного развёртывания,
# а не после сборки: сборка говорит, что образ собрался, а не что он работает.
set -euo pipefail

tag="deploy-$(date -u +%Y%m%d-%H%M%S)"
previous="$(git tag --list 'deploy-*' --sort=-creatordate | head -1)"

git tag "$tag" "$SHA"
git push origin "$tag"

if [ -n "$previous" ]; then
  notes="$(git log --pretty='- %s' "$previous..$SHA")"
else
  notes="Первое отмеченное развёртывание."
fi

gh release create "$tag" --title "$tag" --notes "$notes"
echo "Развёрнутая версия отмечена: $tag"
