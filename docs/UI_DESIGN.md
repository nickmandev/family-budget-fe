# UI Design System

## Mockup

An interactive HTML mockup is available at:

**`../design/mockup-dashboard.html`**

Open it in a browser to see the actual colors, spacing, and responsive behavior. It includes:

- Login screen
- Dashboard with summary cards, accounts, envelopes, recent transactions
- Transactions list screen
- Plans screen
- Record Transaction modal

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| `violet-950` | `#2E1065` | Sidebar, topbar, dark surfaces |
| `violet-900` | `#3C1380` | Hover states on dark surfaces |
| `violet-700` | `#5B21B6` | Strong accents |
| `violet-600` | `#7C3AED` | Primary buttons, active nav, links |
| `violet-500` | `#8B5CF6` | Icons, secondary accents |
| `violet-100` | `#EDE9FE` | Borders, dividers, progress track |
| `violet-50` | `#F5F3FF` | Page background |
| `fuchsia-600` | `#C026D3` | Gradient end, strong accent |
| `fuchsia-500` | `#D946EF` | Badges, highlights, CTA accents |
| `fuchsia-400` | `#E879F9` | Soft highlights |
| `emerald-500` | `#10B981` | Income, positive balances, success |
| `emerald-100` | `#D1FAE5` | Success badge background |
| `rose-500` | `#F43F5E` | Expenses, errors, danger |
| `rose-100` | `#FFE4E6` | Expense badge background |
| `amber-500` | `#F59E0B` | Warnings, resolution alerts |
| `slate-900` | `#0F172A` | Primary text |
| `slate-600` | `#475569` | Secondary text |
| `slate-400` | `#94A3B8` | Placeholder text |
| `white` | `#FFFFFF` | Cards, modals, inputs |

---

## Typography

- **Font family**: `Inter`, system sans-serif fallback
- **Headings**: semibold, tight tracking
- **Body**: normal weight, readable line height
- **Monospace amounts**: tabular figures where supported

---

## Core Components

### Buttons

**Primary**
```
bg-gradient-to-r from-violet-600 to-fuchsia-500
text-white
rounded-xl
px-5 py-3
font-semibold
shadow-lg shadow-violet-500/25
hover:from-violet-700 hover:to-fuchsia-600
hover:shadow-xl hover:shadow-violet-500/35
hover:-translate-y-0.5
transition-all
```

**Secondary**
```
bg-white
border border-violet-200
text-violet-700
rounded-xl
px-5 py-3
font-medium
hover:bg-violet-50
transition-colors
```

**Ghost (sidebar nav)**
```
text-violet-200
rounded-xl
px-4 py-3
hover:bg-violet-900/70 hover:text-white
transition-all
```

### Cards

```
bg-white
rounded-2xl
border border-violet-100
shadow-sm
hover:shadow-md
transition-all
```

### Inputs

```
w-full
px-4 py-3
rounded-xl
border border-violet-200
focus:border-fuchsia-500
focus:ring-4 focus:ring-fuchsia-500/10
outline-none
transition-all
```

### Modal

```
Overlay: fixed inset-0 bg-violet-950/60 backdrop-blur-sm
Card: bg-white rounded-2xl shadow-2xl border border-violet-100
```

### Progress Bar

```
Track: h-2.5 bg-violet-100 rounded-full overflow-hidden
Fill: h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full
```

### Badges

| Type | Classes |
|---|---|
| Income | `bg-emerald-100 text-emerald-700` |
| Expense | `bg-rose-100 text-rose-700` |
| Transfer | `bg-violet-100 text-violet-700` |
| Reserved plan | `bg-fuchsia-100 text-fuchsia-700` |
| Draft plan | `bg-violet-100 text-violet-700` |
| Completed plan | `bg-emerald-100 text-emerald-700` |

---

## Layout Patterns

### Shell

- **Desktop**: fixed dark violet sidebar (256px) + topbar + scrollable main content
- **Tablet/Mobile**: collapsible sidebar drawer + topbar + bottom navigation bar
- **Page padding**: `p-4` mobile, `p-8` desktop
- **Max content width**: `max-w-7xl mx-auto`

### Grid

- Dashboard summary cards: `grid-cols-1 md:grid-cols-3`
- Dashboard main content: `grid-cols-1 xl:grid-cols-3` (2/3 + 1/3 split)
- Forms: single column on mobile, two columns on desktop where appropriate

### Spacing

- Section gaps: `gap-6` / `gap-8`
- Card internal padding: `p-5` or `p-6`
- Form field gaps: `gap-4` or `gap-5`

---

## Responsive Breakpoints

Use Tailwind defaults:

- `sm`: 640px
- `md`: 768px (sidebar appears, grids switch)
- `lg`: 1024px
- `xl`: 1280px (dashboard two-column layout)

---

## Accessibility Notes

- All interactive elements must have visible focus states (`focus:ring-fuchsia-500/20`)
- Color alone should not convey meaning; use icons + text
- Form inputs must have associated labels
- Modal must trap focus and close on Escape
- Sufficient contrast for text on all backgrounds
