# General Coding Rules

## TypeScript

- Never use `any` — use `unknown` and narrow it, or define a proper type
- All component props must have explicit types — never rely on inference for props
- All API response types must be imported from `@/lib/api` — never redefine them locally
- Use `Partial<T>` for update payloads, not a manually duplicated type with optional fields

## Imports

- Path alias `@/` maps to `src/` — always use it, never use relative `../../`
- Import order: React → third-party → `@/components/watermelon-ui/*` → `@/components/*` → `@/lib/*`
- Never import the same symbol from two different paths

## State Management

- Local UI state (loading, dialog open, form values) → `useState`
- Auth and user session → `useAuthStore` from `@/lib/auth`
- No other global state libraries — do not add Redux, Jotai, Recoil, etc.
- Never store derived data in state — compute it from existing state inline

## React Patterns

- `useEffect` for data fetching must always have a cleanup or dependency array — never omit `[]`
- `useCallback` only when the function is a dependency of another `useEffect` or passed to a memoized child
- Never use `useEffect` to sync state to state — derive it instead
- Form field handlers must use the pattern: `(e) => setForm(f => ({ ...f, key: e.target.value }))`

## File Organization

```
src/
  components/
    watermelon-ui/   ← UI primitives, never modify
    ui/              ← shadcn base, never use directly in pages
    Can.tsx          ← permission gate, used everywhere
    ConfirmDialog.tsx ← delete confirm + StatusAlert
    DataTable.tsx    ← reusable table
    UserFormDialog.tsx ← user create/edit modal
  lib/
    api.ts           ← all API types + axios modules
    auth.ts          ← zustand auth store + hooks
  pages/             ← one file per route, page + its dialogs
```

- One page component per file in `src/pages/`
- Form dialogs that belong to a single page live in that page's file, above the page component
- Shared components (used in 2+ pages) go in `src/components/`
- Never create new files in `src/components/watermelon-ui/` or `src/components/ui/`

## Naming Conventions

- Pages: `PascalCase` + `Page` suffix → `UsersPage`, `BotsPage`
- Form dialogs: `PascalCase` + `FormDialog` suffix → `BotFormDialog`, `BudgetFormDialog`
- API modules: `camelCase` + `Api` suffix → `botsApi`, `budgetApi`
- Types: `PascalCase` → `Bot`, `Budget`, `ListUser`
- Hooks: `use` prefix → `useRoleName`, `useHasPermission`

## Performance

- Never animate `filter: blur()` — it forces GPU repaint on every frame
- Never animate `perspective` + `rotateX/Y` — use `opacity + scale + y` instead
- Modal animations must use `duration: 0.15–0.18` with `ease: 'easeOut'` — no spring animations on modals
- Never use `setInterval` — use recursive `setTimeout` if polling is needed

## No Unused Code

- Never leave unused imports — remove them immediately
- Never leave unused state variables
- Never leave `console.log` or `console.error` in committed code
- Never leave TODO comments without a linked issue
- Never create a component and not use it
