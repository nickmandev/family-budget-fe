# Implementation Tasks

This document breaks the frontend build into discrete tasks to be delegated to implementors. Each task is self-contained and builds on the previous ones.

## Environment

- **Project root**: `/mnt/Development/Projects/Personal/family-budget-fe`
- **API contract**: `/mnt/Development/Projects/Personal/family-budget/docs/openapi.yaml`
- **Design mockup**: `/mnt/Development/Projects/Personal/family-budget-fe/design/mockup-dashboard.html`
- **Main plan**: `./PLAN.md`

---

## Task 1 — Scaffold Angular v19 App

**Goal**: Create the project foundation with the agreed stack.

**Acceptance criteria**:
- [ ] `ng new` Angular 19 project with standalone components, no SSR, routing enabled
- [ ] Tailwind CSS configured with custom violet/fuchsia color tokens from PLAN.md
- [ ] NgRx Store, Effects, Entity, StoreDevtools installed and wired in `app.config.ts`
- [ ] `environments/environment.ts` and `environment.prod.ts` with `apiBaseUrl`
- [ ] Folder structure from PLAN.md created (empty folders with `.gitkeep` if needed)
- [ ] `npm run lint` and `npm run build` pass
- [ ] README updated with install/run commands

**Deliverables**:
- Working `ng serve` showing a default app shell

---

## Task 2 — Generate OpenAPI Client & Core Interceptors

**Goal**: Wire the frontend to the backend contract.

**Acceptance criteria**:
- [ ] `openapi/family-budget.yaml` references `../family-budget/docs/openapi.yaml`
- [ ] `npm run generate:api` script generates TypeScript client into `src/app/core/api/generated`
- [ ] Generated client is in `.gitignore` or committed? (decide and document)
- [ ] `AuthInterceptor` adds `Authorization: Bearer <token>`
- [ ] `IdempotencyInterceptor` adds `Idempotency-Key: <uuid>` to mutations and reuses on retry
- [ ] `RequestIdInterceptor` adds `X-Request-ID: <uuid>`
- [ ] `ErrorInterceptor` dispatches toast actions for backend errors and redirects to login on 401
- [ ] `ApiConfiguration` sets base path from environment

**Deliverables**:
- A test page/component that calls `/health` successfully

---

## Task 3 — Auth Feature

**Goal**: Users can register, log in, and stay authenticated.

**Acceptance criteria**:
- [ ] `AuthService` with login/register/logout/loadMe methods
- [ ] Token + expiry stored in `localStorage`; `token$` observable exposed
- [ ] NgRx `auth` feature: actions, reducer, effects, selectors
- [ ] Login page with reactive form and validation
- [ ] Register page with reactive form and validation (email, password min 8)
- [ ] `AuthGuard` protects private routes; `PublicGuard` redirects authenticated users
- [ ] App init loads `/auth/me` and restores session if token exists
- [ ] Logout clears state and storage

**Deliverables**:
- Functional login/register flow against the running API

---

## Task 4 — Shell Layout & Household Feature

**Goal**: Authenticated users see the app shell and can manage households.

**Acceptance criteria**:
- [ ] `ShellComponent` with responsive sidebar (desktop) / drawer (mobile), topbar, bottom nav on mobile
- [ ] Household switcher in topbar
- [ ] NgRx `household` feature: load, create, select
- [ ] Household list page
- [ ] Create household form (name, currency, timezone)
- [ ] Household settings page: list members, add member (owner only), remove member
- [ ] Selected household ID persisted in URL/state and used for all API calls

**Deliverables**:
- User can create a household and see it selected; routes update accordingly

---

## Task 5 — Dashboard Feature

**Goal**: Main landing page shows budget overview.

**Acceptance criteria**:
- [ ] NgRx `balance` feature: load balances and resolution
- [ ] Summary cards: Ready to Assign, Budgetable Cash, Reserved
- [ ] Accounts summary list
- [ ] Envelopes summary with progress bars
- [ ] Recent transactions list (latest 5–10)
- [ ] Resolution alert when budget requires resolution
- [ ] CTAs: Assign Money, Record Transaction, New Plan

**Deliverables**:
- Dashboard matches the design mockup visually and loads real data

---

## Task 6 — Accounts Feature

**Goal**: Manage accounts.

**Acceptance criteria**:
- [ ] NgRx `account` feature: load, create, update
- [ ] Account list page with archived toggle
- [ ] Create account form
- [ ] Edit account form
- [ ] Record opening balance flow
- [ ] Account detail page with filtered transactions

**Deliverables**:
- CRUD for accounts works end-to-end

---

## Task 7 — Envelopes Feature

**Goal**: Manage envelopes and move money between them.

**Acceptance criteria**:
- [ ] NgRx `envelope` feature: load, create, update
- [ ] Envelope list page
- [ ] Create/edit/archive envelope
- [ ] Allocate funds from Ready to Assign
- [ ] Reallocate between envelopes
- [ ] Card-payment envelope linking

**Deliverables**:
- Envelope CRUD + allocate/reallocate works end-to-end

---

## Task 8 — Transactions Feature

**Goal**: List and record committed transactions.

**Acceptance criteria**:
- [ ] NgRx `transaction` feature: load list with cursor pagination, record mutations
- [ ] Transaction list page with filters (type, source, date range)
- [ ] "Load more" cursor pagination
- [ ] Record income form
- [ ] Record purchase form (debit/cash/card wizard)
- [ ] Record transfer form
- [ ] Record card payment form
- [ ] Money input directive working

**Deliverables**:
- User can view transactions and record income/purchase/transfer/card payment

---

## Task 9 — Plans Feature

**Goal**: Planned purchases and repayments workflow.

**Acceptance criteria**:
- [ ] NgRx `plan` feature: load, create, authorize, resize, complete, cancel
- [ ] Plan list page grouped by state
- [ ] Create draft plan form
- [ ] Authorize plan (normal + emergency override with reason)
- [ ] Resize reserved plan
- [ ] Complete plan → committed transaction
- [ ] Cancel plan

**Deliverables**:
- Full plan lifecycle works end-to-end

---

## Task 10 — Suggestions Feature

**Goal**: Unconfirmed candidate transaction inbox.

**Acceptance criteria**:
- [ ] NgRx `suggestion` feature: load, create, confirm, edit, cancel, convert
- [ ] Suggestion list page (inbox style)
- [ ] Confirm suggestion as external transaction
- [ ] Edit/cancel suggestion
- [ ] Convert suggestion to draft plan

**Deliverables**:
- Suggestion inbox and transitions work

---

## Task 11 — Advanced Transactions

**Goal**: Complete the transaction recording surface.

**Acceptance criteria**:
- [ ] Record card fee/interest
- [ ] Record refund
- [ ] Record reversal
- [ ] Record correction (transaction/category/metadata)
- [ ] Record reconciliation

**Deliverables**:
- All transaction types from the OpenAPI contract are recordable

---

## Task 12 — Testing & Cloudflare Deployment

**Goal**: App is tested and deployable.

**Acceptance criteria**:
- [ ] Unit tests for reducers, selectors, pipes, validators
- [ ] Component tests for critical forms and wizards
- [ ] Playwright e2e tests for login → create household → record income → allocate → spend
- [ ] Production build passes
- [ ] Cloudflare Pages config documented (`wrangler.toml` or Pages project settings)
- [ ] Environment-specific API URL configured
- [ ] GitHub Action or deploy script prepared

**Deliverables**:
- Production build deployed to Cloudflare Pages

---

## Delegation Order

1. Task 1 — Scaffold
2. Task 2 — API Client + Interceptors
3. Task 3 — Auth
4. Task 4 — Shell + Households
5. Task 5 — Dashboard
6. Task 6 — Accounts
7. Task 7 — Envelopes
8. Task 8 — Transactions
9. Task 9 — Plans
10. Task 10 — Suggestions
11. Task 11 — Advanced Transactions
12. Task 12 — Testing & Deployment

Each task should be delegated only after the previous one is accepted.
