# Git Workflow

Methodology: GitHub Flow (with a long-lived integration branch).

## Branches

| Branch | Role |
|--------|------|
| `main` | Deploy branch. Always deployable. Protected — no direct commits. |
| `dev` | Integration / development branch. Target for all feature work. |
| `features/<name>` | Feature branches. Branched from `dev`, merged back into `dev`. |

Flow: `features/<name>` -> `dev` -> `main`.

- Branch off `dev`, never off `main`.
- Feature branch names: `features/` + kebab-case description (e.g. `features/user-auth`, `features/order-export`).
- Merge into `dev` via Pull Request, reviewed.
- Release: merge `dev` into `main` via Pull Request. Deploy happens from `main`.
- Hotfix: branch from `main` as `features/hotfix-<name>`, merge into `main`, then back-merge `main` into `dev`.
- Rebase feature branches on `dev` before opening a PR; keep history readable.
- Delete feature branches after merge.

## Commit messages

Conventional Commits: `<type>: <short description in imperative mood>`

Types:

| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, deps, config, housekeeping |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or fixing tests |
| `perf` | Performance improvement |
| `build` | Build system, Docker, CI packaging |
| `ci` | CI configuration |
| `style` | Formatting only, no logic change |
| `revert` | Reverting a previous commit |

Optional scope: `feat(auth): add refresh token endpoint`

Rules:
- Subject line lowercase after the type, no trailing period, max ~72 chars.
- Imperative mood: "add", not "added"/"adds".
- Body (optional, after a blank line) explains why, not what.
- Breaking change: `feat!: ...` or a `BREAKING CHANGE:` footer.
