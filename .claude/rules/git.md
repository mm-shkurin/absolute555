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

## Current working branch

**`features/marketplace-scope-cut` is the working branch for the whole marketplace
rebuild. Do not branch off it, and do not open a branch per story.** Every story lands
as its own commit on this branch until it is merged into `dev`.

This is a deliberate exception to the flow above, taken because the backend and frontend
sessions work the same tree at the same time and a branch per story would put them on
different heads. The rules that still apply: one commit per story, conventional commit
subjects, and no direct commits to `main` or `dev`.

## Commands that overwrite the working tree

**Commit before running anything that writes over working-tree files.** Two sessions
share this tree at the same time, so uncommitted work in it is not necessarily yours.

`git checkout-index -f -a`, `git checkout -- .`, `git restore .`, `git reset --hard`,
`git clean -fd`, `git stash` without `-u`, and a rebase or a branch switch over a dirty
tree all replace files that were never staged. There is no reflog for a working-tree
file: once overwritten it is gone.

Before any of them: `git status --short`, and either commit what is there or stop and
ask. This rule exists because `git checkout-index -f -a` was run here to work around an
unrelated Docker problem, and destroyed half a story's uncommitted work.

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
