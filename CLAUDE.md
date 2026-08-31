# absolute555

Monorepo: `backend/` (FastAPI) + `frontend/` (React 19 / CRA / Capacitor).

## Rules

- Git workflow and commit convention: `.claude/rules/git.md` — read before any branch or commit.
- Coding rules (layers, dependency direction, 200-line cap): `.claude/rules/coding-rules.md`
- Story/spec workflow: `.claude/rules/workflow.md`
- Tech stack of record: `ProductSpecification/technology.md`

## Guidelines

Deferred detail, read when the work touches it:

- `.claude/guidelines/coding-detail.md` — DDD and code-style catalogue
- `.claude/guidelines/frontend-rules.md` — humble object, component size, feature layout
- `.claude/guidelines/tdd-rules.md` — red-green-refactor discipline
- `.claude/guidelines/hazard-catalogue/` — eight groups of recurring failure classes,
  used as a review lens over a drafted change
- `.claude/tech/python-fastapi/` and `.claude/tech/react-js/` — the idioms those rules
  bind to in this stack
- `.claude/templates/refactoring/` — 31 refactoring recipes plus the code-smell routing
  table that maps a smell to its template
- `.claude/templates/tdd/` — red/green templates per layer; `README.md` maps the
  upstream layer names onto this project's. `.claude/templates/testing/` — determinism
  hierarchy, coverage commands, test-review patterns
- `ProductSpecification/ui/ui-conventions.md` — brand, tokens, and component conventions

## Фронтовый конвейер

Экран проходит путь **мокап → контракт → вёрстка → тесты (чистые и браузерные) →
рефактор → учёт**; шаги, гейты и то, что каждый из них ловит, — в
`.claude/skills/frontend-delivery/SKILL.md`.

## Specs

`ProductSpecification/` holds product context. `/interview` gathers story context, `/api-spec` generates OpenAPI 3.0.3 into `ProductSpecification/api-specs/`.
