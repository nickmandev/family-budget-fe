# Family Budget — Frontend

Web frontend for the **family-budget** project. It talks to the shared Go REST
API at `/api/v1` (same contract as the Android client).

## Tech stack

- **Angular 19** — standalone components, routing enabled, no SSR
- **TypeScript 5.7**
- **Tailwind CSS 3** — custom violet/fuchsia design tokens
- **NgRx 19** — Store, Effects, Entity, StoreDevtools
- **ESLint** via `angular-eslint`
- **Tests** — Jasmine + Karma

## Prerequisites

- Node.js 22+ and npm
- The Go backend running locally for anything that hits the API

Pull requests run verification only. Deployment to Cloudflare Pages runs only
after a push or merge to `main`.

## Install

```bash
npm install
```

## Development server

```bash
npm run start            # or: ng serve
```

Open `http://localhost:4200/`. The app reloads automatically on source changes.

## Build

```bash
npm run build            # production build -> dist/family-budget-fe/browser
```

## Lint

```bash
npm run lint
```

## Unit tests

```bash
npm run test             # or: ng test
```

## Environments

API base URL is configured per environment and imported from
`src/environments/environment.ts`:

| Environment | File | `apiBaseUrl` |
|---|---|---|
| Development | `src/environments/environment.ts` | `http://localhost:8080/api/v1` |
| Production | `src/environments/environment.prod.ts` | `https://budget-api.nickmandev.com/api/v1` |

The production file is swapped in automatically during a production build
(`angular.json` → `configurations.production.fileReplacements`).

## API client

The TypeScript Angular client is generated from the vendored backend contract
in `openapi/family-budget.yaml` into `src/app/core/api/generated/`.

```bash
npm run generate:api
```

The generated client is **committed to the repository** so normal builds and
CI do not need Java or the generator. Regeneration requires Java 11+ (the
script downloads a local Temurin JDK 21 into `.tools/` when none is found).
Re-copy the spec from the backend repository before regenerating:

```bash
cp ../family-budget/docs/openapi.yaml openapi/family-budget.yaml
npm run generate:api
```

HTTP concerns are wired in `app.config.ts` with functional interceptors:

- `authInterceptor` — adds `Authorization: Bearer <token>` from localStorage
- `requestIdInterceptor` — adds `X-Request-ID` to every request
- `idempotencyInterceptor` — adds `Idempotency-Key` to household mutations
- `errorInterceptor` — parses the error envelope, clears the token on `401`

The `/health-test` route calls `GET /health` through the generated client to
verify the wiring.

## Project structure

```
src/
├── app/
│   ├── core/          # API layer, auth, interceptors, config, error handling
│   ├── shared/        # Reusable components, pipes, directives, validators
│   ├── state/         # NgRx feature slices (app.state.ts is the root)
│   ├── features/      # Routed feature areas (auth, dashboard, accounts, …)
│   ├── app.config.ts  # Root providers (router, HTTP + interceptors, NgRx)
│   └── app.routes.ts  # Route definitions
├── environments/
├── index.html
├── main.ts
└── styles.css
openapi/               # OpenAPI contract (added in Task 2)
scripts/               # Codegen / tooling scripts
```

## Docs

Planning and design documentation live in [`docs/`](./docs):

- `PLAN.md` — overall implementation plan
- `IMPLEMENTATION_TASKS.md` — task breakdown
- `UI_DESIGN.md` — design system and color palette
