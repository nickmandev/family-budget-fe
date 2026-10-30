# Family Budget Frontend — Implementation Plan

## Project Context

This is the web frontend for the **family-budget** project. It shares the same Go REST API (`/api/v1`) as the Android client. The API contract is defined in `../family-budget/docs/openapi.yaml`.

### Decisions already confirmed by product owner

| Topic | Decision |
|---|---|
| Web vs Android | Both are full-fledged access points; web complements Android |
| Angular version | v19 |
| State library | NgRx Store + Entity + Effects |
| SSR | No |
| Offline strategy | Online-first; API is the single source of truth; no local authoritative ledger state |
| Token storage | `localStorage` |
| Styling | Tailwind CSS, custom component library |
| Forms | Angular Reactive Forms |
| Color direction | Purple / fuchsia primary palette |
| Design mockup | `design/mockup-dashboard.html` |
| Deployment | Cloudflare Pages |
| API client | Auto-generated from OpenAPI |

---

## 1. Tech Stack

- **Framework**: Angular 19 (standalone components, signals-aware)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **State**: NgRx Store + Entity + Effects
- **Reactive streams**: RxJS
- **Icons**: Heroicons (SVG, inline)
- **Date/time**: `date-fns` + `date-fns-tz` or `luxon`
- **Money formatting**: `Intl.NumberFormat`
- **API client**: OpenAPI Generator (`typescript-angular`)
- **Testing**: Jasmine + Karma (unit), Angular Testing Library (components), Playwright (e2e)
- **Build/deploy**: Cloudflare Pages

---

## 2. Project Structure

```
family-budget-fe/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── api/                       # Generated + custom API layer
│   │   │   ├── auth/                      # AuthService, token storage, guards
│   │   │   ├── interceptors/              # auth, idempotency, request-id, error
│   │   │   ├── config/                    # AppConfig, environment injection
│   │   │   └── errors/                    # Error code mapping, global handler
│   │   ├── shared/
│   │   │   ├── components/                # Button, Card, Modal, Input, Select, Toast, MoneyInput
│   │   │   ├── pipes/                     # money, dateInZone, operationTypeLabel
│   │   │   ├── directives/                # moneyInput
│   │   │   └── validators/                # amount, email, password
│   │   ├── state/                         # NgRx feature slices
│   │   │   ├── app.state.ts
│   │   │   ├── auth/
│   │   │   ├── household/
│   │   │   ├── account/
│   │   │   ├── envelope/
│   │   │   ├── balance/
│   │   │   ├── transaction/
│   │   │   ├── plan/
│   │   │   └── suggestion/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── pages/login/
│   │   │   │   └── pages/register/
│   │   │   ├── dashboard/
│   │   │   ├── households/
│   │   │   ├── accounts/
│   │   │   ├── envelopes/
│   │   │   ├── transactions/
│   │   │   ├── plans/
│   │   │   ├── suggestions/
│   │   │   └── settings/
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── environments/
│   ├── index.html
│   └── main.ts
├── openapi/
│   └── family-budget.yaml                 # symlink or copy from ../family-budget/docs/openapi.yaml
├── scripts/
│   └── generate-api-client.sh
├── tailwind.config.js
├── playwright.config.ts
└── angular.json
```

---

## 3. Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `violet-950` | `#2E1065` | Sidebar, topbar |
| `violet-600` | `#7C3AED` | Primary buttons, active nav |
| `violet-500` | `#8B5CF6` | Links, icons |
| `fuchsia-500` | `#D946EF` | Accent, gradient end, badges |
| `fuchsia-400` | `#E879F9` | Highlights |
| `surface` | `#FFFFFF` | Cards, modals |
| `muted` | `#F5F3FF` | Page background (violet-50) |
| `success` | `#10B981` | Income, positive balances |
| `danger` | `#EF4444` | Expenses, errors, deficits |
| `warning` | `#F59E0B` | Alerts, resolution required |

### Core Components

- `fb-button-primary`: gradient violet→fuchsia, white text, shadow
- `fb-button-secondary`: white, violet border, violet text
- `fb-card`: white, rounded-2xl, violet-100 border, shadow-sm
- `fb-input`: violet-200 border, fuchsia focus ring
- `fb-select`: same as input, chevron icon
- `fb-modal`: white card, violet-950/60 backdrop blur
- `fb-toast`: success/error/warning variants
- `fb-badge`: income/expense/transfer/plan-state variants
- `fb-progress`: violet-100 track, violet→fuchsia fill
- `fb-money-input`: text input that stores minor units

---

## 4. API Integration

### Generated Client

Use OpenAPI Generator to produce TypeScript-Angular services from `openapi.yaml`:

```bash
openapi-generator-cli generate \
  -i ../family-budget/docs/openapi.yaml \
  -g typescript-angular \
  -o src/app/core/api/generated
```

Add `npm run generate:api` script and run it in CI to detect contract drift.

### HTTP Interceptors

1. **AuthInterceptor**: attach `Authorization: Bearer <token>` from `localStorage`
2. **IdempotencyInterceptor**: add `Idempotency-Key: <uuid>` to all mutation requests; reuse key on retry
3. **RequestIdInterceptor**: add `X-Request-ID: <uuid>` to all requests
4. **ErrorInterceptor**: map backend `{ error: { code, message, field, details, request_id } }` to a global toast/snackbar; on `401 UNAUTHENTICATED` dispatch logout

### Service Layer

Wrap generated services in thin domain services (e.g., `TransactionService`, `PlanService`) to:
- Map DTOs to domain models if needed
- Compose multi-step flows
- Centralize error handling and retry logic

---

## 5. State Management

### Global Store Slices

```ts
interface AppState {
  auth: AuthState;
  households: EntityState<Household> & { selectedId: string | null; loading: boolean; error: string | null };
  accounts: EntityState<Account> & { loading: boolean; error: string | null };
  envelopes: EntityState<Envelope> & { loading: boolean; error: string | null };
  balances: { data: Balances | null; loading: boolean; error: string | null };
  transactions: EntityState<Transaction> & { nextCursor: string | null; loading: boolean; error: string | null };
  plans: EntityState<Plan> & { loading: boolean; error: string | null };
  suggestions: EntityState<Suggestion> & { loading: boolean; error: string | null };
  ui: {
    sidebarOpen: boolean;
    toasts: Toast[];
    activeModal: string | null;
  };
}
```

### State Rules

- API is the source of truth.
- After every successful mutation, reload affected slices (`balances`, `transactions`, `accounts`, `envelopes`, `plans`, `suggestions`).
- Use NgRx Effects for all side effects (HTTP calls, navigation, toasts).
- Use Angular Signals for local component state (modal open, form dirty, selected filters).

---

## 6. Routing

```ts
const routes: Routes = [
  { path: 'login', component: LoginPageComponent, canActivate: [publicGuard] },
  { path: 'register', component: RegisterPageComponent, canActivate: [publicGuard] },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'households', component: HouseholdListPageComponent },
      { path: 'households/new', component: HouseholdFormPageComponent },
      { path: 'households/:id/settings', component: HouseholdSettingsPageComponent },
      { path: 'accounts', component: AccountListPageComponent },
      { path: 'accounts/new', component: AccountFormPageComponent },
      { path: 'envelopes', component: EnvelopeListPageComponent },
      { path: 'envelopes/new', component: EnvelopeFormPageComponent },
      { path: 'transactions', component: TransactionListPageComponent },
      { path: 'transactions/new', component: TransactionWizardComponent },
      { path: 'plans', component: PlanListPageComponent },
      { path: 'plans/:id', component: PlanDetailPageComponent },
      { path: 'suggestions', component: SuggestionListPageComponent },
      { path: 'settings', component: SettingsPageComponent },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
```

---

## 7. Feature Specifications

### 7.1 Auth
- Login and register pages with reactive forms
- Password min 8 chars matching backend
- Store token + `expires_at` in `localStorage`
- `AuthService` exposes `token$` observable
- Auth guard redirects to `/login`; public guard redirects authenticated users to `/dashboard`
- Auto-logout on 401 or expiry

### 7.2 Household Shell
- Household switcher in topbar
- Create household wizard (name, currency, timezone)
- Household settings page: list members, add member by email (owner only), remove member
- Load and cache household list on app init

### 7.3 Dashboard
- Summary cards: Ready to Assign, Budgetable Cash, Reserved, resolution status
- Accounts list with posted/spendable/reserved balances
- Envelopes list with progress bars (balance vs spendable)
- Recent transactions (latest 5–10)
- Pending suggestions / reserved plans callouts
- CTAs: Assign Money, Record Transaction, New Plan

### 7.4 Accounts
- List accounts with archived toggle
- Create account (name, kind, budget eligible)
- Update account (name, status, budget eligibility)
- Record opening balance
- Show account detail + filtered transaction history

### 7.5 Envelopes
- List envelopes with balances and reservations
- Create/edit/archive envelope
- Allocate funds from Ready to Assign
- Reallocate between envelopes
- Link card-payment envelope to credit-card liability

### 7.6 Transactions
- List with filters: type, source, from/to effective date
- Cursor pagination (infinite scroll or "Load more")
- Record forms:
  - Income
  - Purchase (debit/cash/card)
  - Transfer
  - Card payment
  - Card fee/interest
  - Refund
  - Reversal
  - Correction
  - Reconciliation
- Use a wizard for complex purchase forms

### 7.7 Plans
- List plans grouped by state
- Create draft plan (purchase/repayment)
- Authorize (normal or emergency override with reason + optional reallocation)
- Resize reserved plan
- Complete plan → committed transaction
- Cancel plan

### 7.8 Suggestions
- Inbox-style list
- Confirm as external transaction
- Edit/cancel/convert to draft plan

---

## 8. Money & Date Handling

### Money
- All amounts stored and transmitted as integer **minor units**
- NEVER use floating-point arithmetic
- `MoneyPipe`: formats minor units to currency using `Intl.NumberFormat`
- `moneyInput` directive: converts user input "12.34" → 1234

### Dates
- `EffectiveDate`: `YYYY-MM-DD` string in household timezone
- Audit timestamps: RFC 3339 UTC; display in household timezone
- Use `date-fns-tz` or `luxon` for timezone conversion

---

## 9. Testing Strategy

| Layer | Tool | Focus |
|---|---|---|
| Unit | Jasmine/Karma or Jest | Pipes, reducers, selectors, validators |
| Component | Angular Testing Library | Forms, modal flows, wizard steps |
| Store/Effects | NgRx testing utilities | Effect chains, error handling |
| E2E | Playwright | Login → create household → record income → allocate → spend |

---

## 10. Build & Deployment

1. `ng build --configuration production`
2. Output: `dist/family-budget-fe/browser`
3. Deploy to **Cloudflare Pages**
4. Custom domain managed in Cloudflare
5. API base URL configured per environment
6. CORS configured on Go API for the Cloudflare Pages origin

---

## 11. Implementation Phases

| Phase | Deliverables | Estimated Effort |
|---|---|---|
| **P1: Scaffold** | Angular v19 project, Tailwind, NgRx, folder structure, design tokens | 1–2 days |
| **P2: API Client** | OpenAPI generation script, interceptors, error handling | 1–2 days |
| **P3: Auth** | Login/register pages, auth state, guards, token storage | 2–3 days |
| **P4: Shell + Households** | Layout, routing, household list/create/select/settings | 2–3 days |
| **P5: Dashboard** | Summary cards, accounts, envelopes, recent transactions | 3–4 days |
| **P6: Accounts + Envelopes** | CRUD, opening balance, allocate/reallocate | 3–4 days |
| **P7: Transactions** | List + pagination + record income/purchase/transfer | 4–5 days |
| **P8: Plans + Suggestions** | Draft/authorize/complete/cancel, suggestion inbox | 3–4 days |
| **P9: Advanced Ops** | Refunds, reversals, corrections, reconciliation | 3–4 days |
| **P10: Polish + Deploy** | Responsive mobile, tests, Cloudflare Pages config | 3–5 days |

---

## 12. API Contract Reference

- File: `../family-budget/docs/openapi.yaml`
- Base path: `/api/v1`
- Auth: Bearer token
- Mutation requests require `Idempotency-Key` header
- Pagination: opaque `cursor` + `limit`
- Error envelope: `{ error: { code, message, field, details, request_id } }`

---

## 13. Notes for Implementors

- Always treat the API as the source of truth.
- Reload dependent state after mutations; do not maintain authoritative balances in the frontend.
- Use generated DTOs directly; avoid hand-writing request/response models unless the generator produces poor types.
- Keep components presentational; business logic belongs in services/effects.
- Use `OnPush` change detection where possible.
- Mobile layout must be fully usable: sidebar becomes drawer, bottom nav on small screens.
