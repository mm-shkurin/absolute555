"""Гейт архитектурных правил репозитория: лимит длины файла и направление зависимостей.

Правила описаны один раз — в `.claude/skills/sprint-check/probes/config.json`, откуда их
читает и человек, и этот скрипт. Второй список правил разошёлся бы с первым в тот же день.

Гейт работает храповиком. Нарушения, которые уже есть в коде, записаны в
`scripts/repo-rules-baseline.json` и прогон не валят; валит его НОВОЕ нарушение. Обратная
сторона храповика важнее прямой: когда нарушение чинят, скрипт требует убрать строку из
списка — иначе список превращается в кладбище, которое никто не разбирает.

Запуск: python scripts/check_repo_rules.py [--update-baseline]
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / ".claude/skills/sprint-check/probes/config.json"
BASELINE = ROOT / "scripts/repo-rules-baseline.json"

# Что живёт вне лимита длины. Миграции генерирует Alembic, каталог марок — это данные:
# и то и другое нельзя разрезать на куски по 200 строк, не выдумав границу без смысла.
LINE_LIMIT_EXEMPT = (
    "backend/alembic/versions/",
    "backend/app/data/",
)


def load_config() -> dict:
    return json.loads(CONFIG.read_text(encoding="utf-8"))


def source_files(patterns: list[str], roots: list[str]) -> list[Path]:
    found: list[Path] = []
    for root in roots:
        base = ROOT / root
        if not base.exists():
            continue
        for pattern in patterns:
            found.extend(p for p in base.rglob(pattern) if "__pycache__" not in p.parts)
    return sorted(set(found))


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def check_line_limit(config: dict) -> list[str]:
    limit = config["file_line_limit"]
    problems: list[str] = []
    for layer in config["layers"].values():
        for path in source_files(layer["src"] + layer.get("styles", []), layer["code"]):
            name = relative(path)
            if name.startswith(LINE_LIMIT_EXEMPT):
                continue
            lines = len(path.read_text(encoding="utf-8", errors="ignore").splitlines())
            if lines > limit:
                problems.append(f"{name}: {lines} строк при лимите {limit}")
    return problems


def check_forbidden_imports(config: dict) -> list[str]:
    problems: list[str] = []
    for layer in config["layers"].values():
        for rule in layer.get("forbidden_imports", []):
            pattern = re.compile(rule["regex"], re.MULTILINE)
            for path in source_files(layer["src"], rule["in"]):
                text = path.read_text(encoding="utf-8", errors="ignore")
                for number, line in enumerate(text.splitlines(), start=1):
                    if pattern.search(line):
                        problems.append(f"{relative(path)}:{number}: {rule['name']}")
    return problems


def main() -> int:
    config = load_config()
    found = sorted(check_line_limit(config) + check_forbidden_imports(config))

    if "--update-baseline" in sys.argv:
        BASELINE.write_text(
            json.dumps({"known": found}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print(f"Записано известных нарушений: {len(found)}")
        return 0

    known = set(json.loads(BASELINE.read_text(encoding="utf-8"))["known"]) if BASELINE.exists() else set()
    new = [item for item in found if item not in known]
    fixed = sorted(known - set(found))

    if new:
        print("Новые нарушения правил репозитория:")
        for item in new:
            print(f"  {item}")
    if fixed:
        print("Эти нарушения починены — уберите их из scripts/repo-rules-baseline.json:")
        for item in fixed:
            print(f"  {item}")

    if not new and not fixed:
        print(f"Правила репозитория соблюдены. Известных нарушений в списке: {len(known)}.")
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
