# Audit Log

## Iteration 1 — Score: 2.5 / 3.0 — 2026-09-14 — 9a287d5
### Fixed Issues:
- none (first run)
### Outstanding Blockers:
- `.gitignore` is the CRA template: `/dist` and `.env` not ignored
- README layout claims `hooks/ utils/`, slices use `logic/` and root hooks
- empty `catch` in `useDraftSync.ts`, `useProfileIdentity.ts`, `oauthApi.ts`, `chatFrame.ts`
- files at the 200-line cap (`dev/fixtures/wire.ts`, `moderationApi.ts`)
- bulk test backfill commits (`7aeaea0`), 5 `eslint-disable` comments under oxlint
- merged feature branches not deleted; mixed commit scopes
- `sessionStorage` reached directly in `shared/session/accessClosed.ts`

## Iteration 2 — Score: 2.5 / 3.0 — 2026-09-14 — 9a287d5
### Fixed Issues:
- none (confirmation run, no changes between iterations)
### Outstanding Blockers:
- `.gitignore` CRA template; `useWizardServer.ts` four `exhaustive-deps` suppressions
- access token in WebSocket URL (`shared/api/backend/chatSocket.ts:20`)
- README layout and command table out of date (`test:e2e`, `dev:mock`, `format:check`)
- magic values: `callbackOutcome.ts:25` 512, placeholder years in `FilterPanel.tsx:47-62`
- `useDraftSync.ts:41` bare `window.location`; one author under two git identities
- Stage A holds at 2.5 — confirmed.

## Stage B follow-up — 2026-09-14 — 6faa682..939c743
### Fixed Issues:
- all functions ≤ 30 lines (77 blocks), no duplicated blocks, file naming per folder
- one error-translation path, no peer chaining in `send`/`sendPublic`, no pass-through `api/`
- labels out of `shared/domain`, slice layout per README, memoized list rows
- `QueryClient` built in `main.tsx`; response shape guards; unmount guards in hooks
### Outstanding Blockers:
- access token in WebSocket URL (`shared/api/backend/paths.ts:87`) — needs backend
- GIT-BULK: six commits over 40 files; GIT-DIRECT-MAIN (history)
