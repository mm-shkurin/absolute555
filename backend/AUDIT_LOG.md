# Audit Log

## Iteration 1 — Score: 2.5 / 3.0 — 2026-09-14 — 58c9fc8
### Fixed Issues:
- (baseline run, nothing fixed before it)
### Outstanding Blockers:
- History comments in `offer_errors.py`, `listing_errors.py` narrate past violations
- 58 `except Exception` blocks; `print()` in `s3_service.py:150`
- `datetime.utcnow()` in `token_revocation.py` (deprecated, local-time bug in `.timestamp()`)
- No linter/formatter config under `backend/`
- No CHANGELOG / release versioning
- Commit subjects mix Russian and English; `77cdf64` lands 2416 test lines in one commit
- `.claude/rules/git.md` names `features/seller-rating` while work runs on `features/paint-map`
- Hand-picked, near-identical Alembic revision ids
- Largest files sit at 186–198 lines, one change from the 200-line cap

## Iteration 2 — Score: 2.5 / 3.0 — 2026-09-14 — 29da639 (confirmation)
### Fixed Issues:
- History comments removed from error modules, `app/__init__.py`, `config.py`, `main.py`
- `print()` replaced by logger; `utcnow()` removed from token revocation
- ruff config committed, unused imports removed, `sys.path` hack and dead code gone from `main.py`
- GigaChat TLS verified via `GIGA_CA_BUNDLE`; GigaChat timeouts and Yandex OAuth URLs moved to settings
- README rewritten against the code; CHANGELOG added; manual API test cases in `docs/testing/`
### Outstanding Blockers:
- `tests/test_chat.py` (349) and `tests/test_offer_lifecycle.py` (299) exceed the 200-line cap
- 56 `except Exception` blocks; `auth.py` `guest_login` and `_revoke` swallow errors
- ruff rule set minimal (no `I`, `B`, `BLE`); `ruff format --check` not in CI
- `app/utils`, `app/sse` outside the documented layer map; `coding-rules.md` still cites a fixed violation
- Merged `features/*` branches not deleted; FastAPI 0.104 / Starlette 0.27 outdated, no `pip-audit`

## Iteration 3 — Score: 2.5 / 3.0 — 2026-09-14 — 4740395 (confirmation)
### Fixed Issues:
- Docs sessions moved from an in-memory set to Redis; `compare_digest`, secure cookie, `docs.py` deduplicated
- `guest_login` / `_revoke` moved into auth services; broad excepts narrowed across shared, listing, ml, tasks
- ruff selects `BLE`, `B`, `W`; B904 raise-from everywhere; `pytest.raises(Exception)` narrowed
- `config.py` split, page and worker limits in settings; `delete_sale_car` commits before S3 cleanup
- Supplier moderation split out; status enums imported from `domain/`; history comments removed
### Outstanding Blockers:
- 105 f-string log calls (fixed after this audit: lazy loguru arguments)
- `decode_by_vin` nested try reported failure twice (fixed after this audit)
- ruff lacks `UP`, `I`, `C90`; no `ruff format --check` in CI
- `token_revocation.is_revoked` fails open when Redis is down
- Merged `features/*` branches not deleted; two author identities without `.mailmap`
