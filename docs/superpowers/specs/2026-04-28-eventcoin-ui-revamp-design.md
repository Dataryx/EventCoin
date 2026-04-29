# EventCoin UI/UX Revamp — Design Spec

**Date:** 2026-04-28
**Branch:** `frontend-revamp`
**Scope:** Pure frontend revamp. Zero backend / Web3 / contract / routing logic changes.

## Goal

Replace the current Semantic UI React surface with a premium, minimal, exclusive-feeling
design system inspired by Luma, Linear, and Stripe. Add tasteful but expressive
micro-interactions throughout. Keep every existing feature working byte-identically.

## Non-goals

- No changes to contracts, migrations, scripts, or any Web3 logic.
- No route changes (`routes.js` and `server.js` are off-limits).
- No new features, new pages, new data, or new endpoints.
- No upgrade of Next.js or React major versions.

## Design system

### Palette

| Token | Light | Dark |
| --- | --- | --- |
| `bg` | `#FAFAF7` | `#0B0B0A` |
| `surface` | `#FFFFFF` | `#141413` |
| `surface-2` | `#F4F2EC` | `#1B1B19` |
| `text` | `#0A0A0A` | `#F2F0EA` |
| `muted` | `#6B6B66` | `#8C8A85` |
| `border` | `#E8E6DF` | `#23231F` |
| `accent` | `#0E5C3F` | `#0E5C3F` |
| `accent-hover` | `#0A4A33` | `#11704C` |
| `accent-tint` | `rgba(14,92,63,0.08)` | `rgba(14,92,63,0.18)` |
| `danger` | `#B43A3A` | `#D45757` |
| `warning` | `#B8732E` | `#D4934E` |

### Typography

- Display: **Instrument Serif** (Google Fonts via `next/font/google`)
- Body: **Inter** (`next/font/google`, variable)
- Mono: **JetBrains Mono** (`next/font/google`)
- Scale: display clamp 40–96px / body 14–16px / small 12–13px / mono inline

### Shape, spacing, motion

- 8pt grid; max content width 1200px; section padding clamp(64px, 8vw, 128px).
- Radii 12–16px on cards, 8px on inputs/badges, 9999px on pills/avatars.
- Borders: 1px hairlines, ambient shadow only on lift, never resting.
- Motion durations: micro 120ms, short 220ms, page 320ms; easing `cubic-bezier(0.22, 1, 0.36, 1)`.

## Stack additions

| Package | Purpose |
| --- | --- |
| `tailwindcss`, `postcss`, `autoprefixer` | Styling |
| `framer-motion` | All micro-interactions |
| `next-themes` | Light/dark/system toggle |
| `clsx`, `tailwind-merge` | Class composition |
| `lucide-react` | Icons (replaces Semantic icons) |
| `canvas-confetti` | Purchase success burst |

Fonts loaded via `next/font/google` — no CDN, no FOUC.

## Component layer (`components/ui/`)

Built once, reused everywhere:
`Button`, `IconButton`, `Card`, `Input`, `Textarea`, `Label`, `Badge`,
`Dialog`, `Drawer`, `Tabs`, `Toast`, `ThemeToggle`, `WalletPill`,
`Skeleton`, `EmptyState`, `Section`, `Container`, `Divider`.

Helpers: `cn()` (clsx + tailwind-merge), `useReducedMotion`, `useMagneticHover`,
`useCountUp`.

## Layout shell

Rewrite `components/layout.js` and `components/header.js`:
- Layout sets background, font variables, dark-mode class, page transition wrapper.
- Header is a sticky, hairline-bordered top bar with logo, contextual nav, theme
  toggle, and wallet pill on the right.
- `pages/_app.js` (new) wraps the tree in `ThemeProvider`, font CSS variables,
  Toast portal, and `AnimatePresence` for route transitions.

## Micro-interactions catalog (level B — expressive but tasteful)

- Magnetic primary buttons (cursor pull within hover radius).
- Page transitions: 320ms fade + 8px slide.
- Scroll reveals: `whileInView` fade-up, one-shot, viewport once.
- Animated counters: ETH balance, ticket totals, supply numbers.
- Card hover: `translateY(-2px)` + accent border + ambient shadow.
- Ticket flip: 3D Y-axis flip exposing QR; drag-to-flip on touch.
- Purchase success: full-screen confetti burst + ticket reveal.
- Form micro-states: animated focus rings, error shake, success checkmark draw.
- Theme toggle: sun/moon icon morph + soft color crossfade.
- All animations gated behind `prefers-reduced-motion`.

## Scope (option C — hero pages first, then baseline)

### Tier 1 — full premium treatment

- `pages/index.js` — landing
- `pages/client/dashboard.js` — client home
- `pages/client/ticket.js` — single ticket view (the showpiece)
- `pages/events/show.js` — event detail (admin-side)
- `pages/events/clientShow.js` — event detail (client-side, used for purchase)

### Tier 2 — baseline pass (design system applied, no bespoke polish)

- All auth pages (`pages/admin/login.js`, `pages/client/login.js`)
- `pages/client/tickets.js`
- `pages/events/new.js`
- `pages/events/owners/*` (index, validateTicket, useTicket, refundTicket, transferTicket)
- All `pages/admin/*` operational pages

## Phased delivery

| Phase | Output |
| --- | --- |
| 0 | Branch hygiene, deps installed, Tailwind + fonts + theme wired, `_app.js` and `_document.js` created, `components/ui/` primitives built, layout shell rebuilt. App still renders all pages (Semantic UI still present underneath). |
| 1 | Tier 1 pages migrated to new system. Each page demoed before moving on. |
| 2 | Tier 2 pages migrated to new system. |
| 3 | `semantic-ui-react`, `semantic-ui-css` removed; final QA across every route in light + dark; smoke-test purchase, validate, login flows. |
| 4 | User review and approval; merge `frontend-revamp` → `master`; push. |

## Constraints / guarantees

- `server.js`, `routes.js`, `truffle-config.js`, `migrations/`, `contracts/`,
  `ethereum/`, `scripts/`, `test/` are NEVER edited.
- `package.json` contract-tooling scripts (`compile`, `migrate`, `test`, `dev`) untouched.
- All `Link` imports remain from `../routes` to preserve `next-routes` compatibility.
- All web3 reads/writes, account fetches, contract instantiations stay byte-identical
  inside each page — only surrounding JSX/styles change.
- No new env vars, no new server endpoints, no service-worker tricks.

## Acceptance

- Every route from `routes.js` renders without error in both light and dark modes.
- Purchase flow, ticket QR generation, ticket validation, admin event creation,
  and login flows all complete the same way they do on `master`.
- No Semantic UI bundle or CDN reference remains in the final cut.
- Bundle size and Lighthouse perf score should not regress meaningfully.
