# React/JavaScript Coding Conventions

Tech binding for `.claude/guidelines/frontend-rules.md`. Adapted from the upstream
react-ts profile: this frontend is Create React App with plain JavaScript and Sass, not
Vite with TypeScript, so the file extensions and the test runner differ.

Design authority for anything visual: `ProductSpecification/ui/ui-conventions.md`.

## File Extensions (Humble Object)

- Logic files: `.logic.js` — pure functions, no imports from React, no fetch.
- API client files: `.api.js` — axios calls and response mapping only.
- Component files: `.jsx`.

## Feature Structure

Today everything lives under `frontend/src/components/` grouped by screen, with a single
`src/api/api.js`. New work goes into feature directories instead:

- `frontend/src/features/{feature}/components/` — `{Feature}Page.jsx` plus sub-components.
- `frontend/src/features/{feature}/logic/` — `{feature}.logic.js`, `{feature}.api.js`.
- `frontend/src/features/{feature}/__tests__/` — `{feature}.logic.test.js`.

Reusable components shared across features: `frontend/src/shared/ui/`.

## Component Size

- Extract sub-components once a component file passes ~70-100 lines. The hard cap from
  `coding-rules.md` is 200 lines and the current tree breaks it badly —
  `ManualAddCar.jsx` is 653 lines, `Auth.jsx` is 414. Do not extend those files; split
  what you touch.
- Page components are thin orchestrators: fetch, route between views, render children.

## State

- Related state travels together. `Autolist.jsx` holds 21 separate `useState` calls and
  `ManualAddCar.jsx` twelve; that is a single object or a reducer, not twenty slots.
- No shared-state library is declared. Pick one deliberately when the first cross-screen
  state appears, rather than threading props.

## Requests

- Every request that a component starts must be cancellable: pass an `AbortController`
  signal and abort on unmount. The current tree has none, so a navigation mid-flight
  resolves into an unmounted component.
- Progress is pushed, not polled. The backend exposes SSE at `/task/sse/{sale_car_id}`;
  `setInterval` against a status endpoint is a bug, not a fallback.

## Styles

- Sass module per component, imported by that component only. Global imports of a
  component's stylesheet leak its rules into every page.
- Colours, spacing and radii come from the tokens in `ui-conventions.md`. No hex literals
  in component stylesheets.

## Naming

- Logic functions: verb+noun — `validateVin`, `buildListingRequest`, `isFormValid`.
- API functions: verb+noun matching the endpoint — `createListing`, `sendOffer`.
- One export convention per directory. The tree currently mixes default and named
  exports; new files use named exports, and a file you touch converts.

## Testing

- Testing Library plus Jest, both already in `package.json`, run by `react-scripts test`.
- Logic tests are pure: no DOM, no rendering. Component tests render and assert on roles
  and text, never on class names.
