# TDD Templates — layer mapping

These templates come from continue-framework, which assumes a clean-architecture tree:
`acceptance` (black-box over HTTP), `rest` (controllers), `usecase` (application logic).
This project has no such tree. Read them against the real layers:

| Template pair | Upstream layer | Here |
|---|---|---|
| `red-acceptance.md` / `green-acceptance.md` | `acceptance` module, black-box over HTTP | `backend/tests/acceptance/` — httpx against the running stack, no import of app internals |
| `red-rest.md` / `green-rest.md` | REST controller | `backend/app/api/` routers, tested with FastAPI `TestClient` |
| `red-usecase.md` / `green-usecase.md` | usecase | `backend/app/services/` |
| `api-endpoint-precheck.md` | — | applies as written: check the endpoint does not already exist before writing a red test for it |

The cycle itself is unchanged: `.claude/guidelines/tdd-rules.md` is the authority, and
`.claude/tech/python-fastapi/tdd.md` binds it to pytest — `@pytest.mark.skip(reason="RED: ...")`
as the disable marker, `class TestFeatureName:` with `test_should_{behaviour}` methods.

## Status in this project

There are no tests yet, in either layer. The first ones land with story 2, when
`api_router` is mounted and there is a live endpoint to test. Until then these templates
are reference, not process — do not treat the absence of a red test as a violation of a
cycle that has not started.
