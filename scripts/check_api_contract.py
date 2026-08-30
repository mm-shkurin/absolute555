"""Сверка того, что фронтенд зовёт, с опубликованным контрактом API.

Фронтенд знает своё URL-пространство в одном файле — `frontend/src/shared/api/endpoints.ts`.
Контракт бэкенда лежит в `ProductSpecification/api-specs/*.yaml`. Пока эти два списка никто
не сверяет, расхождение живёт до дня интеграции и обнаруживается экраном ошибки.

Спецификации, а не живое приложение: импорт `app.main` на старте подключается к Redis и
MinIO, то есть проверка контракта требовала бы поднятого окружения — и краснела бы от
недоступного хранилища, а не от расхождения. Если живая схема нужна, её можно передать
файлом: `--openapi openapi.json` (пути из неё добавляются к путям из спецификаций).

Храповик: нереализованное перечислено в `scripts/api-contract-baseline.json` и прогон не
валит. Валит его новый путь, которого нет ни в контракте, ни в списке, — и путь, который в
контракте появился: такой надо убрать из списка, иначе список перестаёт что-либо значить.

Запуск: python scripts/check_api_contract.py [--openapi файл.json] [--update-baseline]
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
ENDPOINTS = ROOT / "frontend/src/shared/api/endpoints.ts"
SPECS = ROOT / "ProductSpecification/api-specs"
BASELINE = ROOT / "scripts/api-contract-baseline.json"

# `${V1}/listings/${encodeURIComponent(id)}` → `/api/v1/listings/{}`. Имя параметра нам
# безразлично: в спецификации оно своё, а сверяется форма пути, а не как кто назвал id.
PARAM = re.compile(r"\$\{[^}]*\}")
TEMPLATE = re.compile(r"`([^`]*)`")
BRACED = re.compile(r"\{[^}]+\}")


def frontend_paths() -> set[str]:
    text = ENDPOINTS.read_text(encoding="utf-8")
    version = re.search(r"API_VERSION\s*=\s*'([^']+)'", text)
    mount = re.search(r"MOUNT\s*=\s*'([^']+)'", text)
    prefix = f"/{mount.group(1)}/{version.group(1)}" if mount and version else "/api/v1"

    paths: set[str] = set()
    for raw in TEMPLATE.findall(text):
        if "${V1}" not in raw:
            continue
        path = PARAM.sub("{}", raw.replace("${V1}", prefix))
        # Строка запроса к контракту не относится: она про фильтр, а не про существование
        # ручки.
        paths.add(path.split("?")[0])
    return paths


def contract_paths(argv: list[str]) -> set[str]:
    paths: set[str] = set()
    for spec in sorted(SPECS.glob("*.yaml")):
        document = yaml.safe_load(spec.read_text(encoding="utf-8")) or {}
        paths.update(BRACED.sub("{}", path) for path in (document.get("paths") or {}))

    if "--openapi" in argv:
        live = json.loads(Path(argv[argv.index("--openapi") + 1]).read_text(encoding="utf-8"))
        paths.update(BRACED.sub("{}", path) for path in live.get("paths", {}))
    return paths


def main() -> int:
    argv = sys.argv[1:]
    front = frontend_paths()
    contract = contract_paths(argv)
    missing = sorted(front - contract)

    if "--update-baseline" in argv:
        BASELINE.write_text(
            json.dumps({"not_in_contract": missing}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Записано путей вне контракта: {len(missing)}")
        return 0

    known = set(json.loads(BASELINE.read_text(encoding="utf-8"))["not_in_contract"])
    new = [path for path in missing if path not in known]
    landed = sorted(known - set(missing))

    print(f"Фронтенд зовёт путей: {len(front)}. Контракт описывает: {len(contract)}.")
    print(f"Вне контракта: {len(missing)}.")

    if landed:
        print("\nЭти пути появились в контракте — уберите их из scripts/api-contract-baseline.json:")
        for path in landed:
            print(f"  {path}")
    if new:
        print("\nФронтенд зовёт путь, которого нет ни в контракте, ни в списке ожидаемых:")
        for path in new:
            print(f"  {path}")

    return 1 if (new or landed) else 0


if __name__ == "__main__":
    raise SystemExit(main())
