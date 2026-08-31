"""Сверка типов фронтенда с опубликованным контрактом API.

Фронтенд описывает провод руками в `frontend/src/shared/api/backend/*.ts`, бэкенд — в
`ProductSpecification/api-specs/*.yaml`. Пока эти два списка никто не сверяет, бэкенд
переименовывает поле, фронтенд узнаёт об этом чтением чужого кода, и расхождение живёт до
первого запроса. За одну сессию так уехали `reason` → `label`, `accept` → `accepted`,
лента из массива в объект и телефон в отдельную ручку.

Сверяются **имена**, а не типы: именно имена и разъезжались. Тип поля — дело TypeScript,
который его и проверит.

Сопоставление по имени и без настройки: интерфейс `SaleCarWire` сверяется со схемой
`SaleCar`, `AutofillWire` — с `Autofill`. Интерфейс, у которого нет схемы с таким именем,
не сверяется — это либо форма самого фронтенда, либо ручка, которой ещё нет в контракте.

Храповик: известные расхождения перечислены в `scripts/contract-types-baseline.json`,
прогон на них не валит. Валит НОВОЕ расхождение — и расхождение, которое починили, но
забыли убрать из списка: список, которому нечего значить, перестаёт что-либо значить.

Запуск: python scripts/check_contract_types.py [--update-baseline]
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
SPECS = ROOT / "ProductSpecification/api-specs"
CONTRACTS = ROOT / "frontend/src/shared/api/backend"
BASELINE = ROOT / "scripts/contract-types-baseline.json"

INTERFACE = re.compile(
    r"export\s+interface\s+(\w+)\s*(?:extends\s+([\w,\s]+?))?\s*\{(.*?)\n\}", re.S
)
UNION = re.compile(r"export\s+type\s+(\w+)\s*=\s*([^\n]+(?:\n\s*\|[^\n]+)*)")
FIELD = re.compile(r"^\s{2}(\w+)\??\s*:", re.M)
LITERAL = re.compile(r"'([^']+)'")


def _fields_of(schema: dict, everywhere: dict) -> set:
    """Поля схемы, включая унаследованные через allOf.

    Схема, собранная из allOf, своих properties почти не имеет: `QueueItem` — это
    карточка ленты плюс три поля модератора. Без разворачивания гейт объявил бы
    расхождением всё, что пришло из базовой схемы.
    """
    fields = set((schema.get("properties") or {}).keys())
    for part in schema.get("allOf") or []:
        reference = part.get("$ref", "")
        if reference:
            fields |= everywhere.get(reference.rsplit("/", 1)[-1], set())
        fields |= set((part.get("properties") or {}).keys())
    return fields


def spec_schemas() -> dict:
    """Каждая схема контракта: её поля и, для перечислений, её значения."""
    raw: dict[str, dict] = {}
    for path in sorted(SPECS.glob("*.yaml")):
        document = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        schemas = (document.get("components") or {}).get("schemas") or {}
        for name, schema in schemas.items():
            raw[name] = {"schema": schema, "spec": path.name}

    # Два прохода: allOf ссылается на схемы, которых при первом чтении может ещё не быть.
    plain = {name: set((one["schema"].get("properties") or {}).keys()) for name, one in raw.items()}
    return {
        name: {
            "fields": _fields_of(one["schema"], plain),
            "enum": set(one["schema"].get("enum") or []),
            "spec": one["spec"],
        }
        for name, one in raw.items()
    }


def frontend_types() -> tuple[dict, dict]:
    """Интерфейсы и перечисления фронтенда, по имени."""
    interfaces: dict[str, dict] = {}
    unions: dict[str, dict] = {}

    for path in sorted(CONTRACTS.glob("*.ts")):
        source = path.read_text(encoding="utf-8")
        for name, bases, body in INTERFACE.findall(source):
            interfaces[name] = {
                "fields": set(FIELD.findall(body)),
                # extends перечисляет базы: QueueItemWire — карточка ленты плюс три поля
                # модератора, ровно как allOf на стороне контракта.
                "extends": [base.strip() for base in bases.split(",") if base.strip()],
                "file": path.name,
            }
        for name, body in UNION.findall(source):
            values = set(LITERAL.findall(body))
            if values:
                unions[name] = {"enum": values, "file": path.name}

    return interfaces, unions


def paired(name: str, schemas: dict) -> str | None:
    """Схема, которой соответствует тип фронтенда, если такая есть."""
    for candidate in (name, name.removesuffix("Wire"), name.removesuffix("Response")):
        if candidate in schemas:
            return candidate
    return None


def _all_fields(name: str, interfaces: dict, seen: set | None = None) -> set:
    """Поля интерфейса вместе с унаследованными через extends."""
    seen = seen or set()
    if name in seen or name not in interfaces:
        return set()
    seen.add(name)

    fields = set(interfaces[name]["fields"])
    for base in interfaces[name].get("extends", []):
        fields |= _all_fields(base, interfaces, seen)
    return fields


def drift() -> list[str]:
    schemas = spec_schemas()
    interfaces, unions = frontend_types()
    found: list[str] = []

    for name, described in sorted(interfaces.items()):
        described = dict(described, fields=_all_fields(name, interfaces))
        schema = paired(name, schemas)
        if schema is None:
            continue
        for field in sorted(described["fields"] - schemas[schema]["fields"]):
            found.append(f"{described['file']}: {name}.{field} — нет в схеме {schema}")
        for field in sorted(schemas[schema]["fields"] - described["fields"]):
            found.append(f"{described['file']}: {name} не описывает {schema}.{field}")

    for name, described in sorted(unions.items()):
        schema = paired(name, schemas)
        if schema is None or not schemas[schema]["enum"]:
            continue
        for value in sorted(described["enum"] - schemas[schema]["enum"]):
            found.append(f"{described['file']}: {name} допускает '{value}', контракт — нет")
        for value in sorted(schemas[schema]["enum"] - described["enum"]):
            found.append(f"{described['file']}: {name} не знает значения '{value}' из {schema}")

    return found


def main() -> int:
    if not CONTRACTS.exists():
        print("Типов фронтенда нет — сверять нечего.")
        return 0

    found = drift()

    if "--update-baseline" in sys.argv:
        BASELINE.write_text(
            json.dumps({"known_drift": sorted(found)}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Записано известных расхождений: {len(found)}")
        return 0

    known = set()
    if BASELINE.exists():
        known = set(json.loads(BASELINE.read_text(encoding="utf-8")).get("known_drift", []))

    fresh = [one for one in found if one not in known]
    fixed = sorted(known - set(found))

    if fresh:
        print("Новые расхождения контракта и типов фронтенда:")
        for one in fresh:
            print(f"  {one}")
    if fixed:
        print("Эти расхождения починены — уберите их из scripts/contract-types-baseline.json:")
        for one in fixed:
            print(f"  {one}")

    if not fresh and not fixed:
        print(f"Контракт и типы фронтенда сходятся. Известных расхождений: {len(known)}.")

    return 1 if (fresh or fixed) else 0


if __name__ == "__main__":
    raise SystemExit(main())
