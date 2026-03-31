# Cognito Manager — Agent Guide

> Loaded by AI coding tools (Claude Code, Codex, Kiro, etc.) at the start of each Ralph loop iteration.
> Keep it brief (~60 lines max). Only add entries when you discover something that saves a future iteration from failure.

## Stack

React 18 + TypeScript (strict) + Vite + Cloudscape Design System + TanStack Router + TanStack Query + MSW + react-i18next

## Build & Run

```bash
pnpm install
pnpm run dev           # starts Vite dev server with MSW mocking enabled
```

## Verify (backpressure)

These commands MUST pass before any commit:

```bash
pnpm run typecheck     # tsc --noEmit
pnpm run lint          # eslint
pnpm run test          # vitest run
```

## TypeScript Rules

- `strict: true` with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- No `any`, `as`, `!`, or untyped `unknown` — use type guards and narrowing
- All API types from `@aws-sdk/client-cognito-identity-provider`

## i18n Rules

- All user-facing strings must use `t()` from react-i18next
- Translation keys namespaced by feature: `t('users:createUser.title')`
- No string literals in JSX

## Reference Docs

### Cognito API
- API operations: `https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_Operations.html`
- Per-operation detail: `https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_{OperationName}.html`

### Cloudscape Design System
- Component docs: `https://cloudscape.design/components/{component-name}/index.html.md`
- API reference: `https://cloudscape.design/components/{component-name}/index.html.json`
- Patterns: `https://cloudscape.design/patterns/{pattern-name}/index.html.md`
- Snippet index: `https://cloudscape.design/snippets-content/index.md`

## Conventions

- Commit messages: `feat: [TASK-ID] — short description`
- One logical change per commit
- Do not modify specs/ files during build mode
- Tests co-located: `Component.tsx` → `Component.test.tsx`
- E2E tests in `e2e/` with page object models in `e2e/pages/`

## Operational Learnings

> Ralph adds entries here when it discovers patterns, gotchas, or workarounds.
> Each entry should explain what AND why. Delete entries that no longer apply.

- **@eslint/js must be explicit**: ESLint 9 flat config imports from `@eslint/js` but doesn't bundle it. Pin `@eslint/js` to `^9.x` to match `eslint ^9.x`.
- **pnpm onlyBuiltDependencies**: esbuild and msw need build scripts. Add `"pnpm": { "onlyBuiltDependencies": ["esbuild", "msw"] }` to package.json to avoid interactive approval prompts.
- **TanStack Router route tree generation**: The Vite plugin (`@tanstack/router-plugin/vite`) auto-generates `src/routeTree.gen.ts` on build. Running `vite build` once bootstraps it. The generated file is ignored by ESLint via `eslint.config.js`.
- **`unknown` absorbs union members**: `unknown | Promise<unknown>` triggers `no-redundant-type-constituents`. For sync-or-async return types, use `unknown` and wrap calls with `Promise.resolve()` in the caller.
- **react-refresh context split**: Exporting both a `createContext()` value and a component from the same file triggers `react-refresh/only-export-components`. Split context creation into a plain `.ts` file and the provider component into a `.tsx` file.
- **TanStack Router tests need `router.load()`**: Components using `useRouter()`/`useMatches()` require a real `RouterProvider`. Call `await router.load()` before `render()` or the route components won't mount. Use `renderWithRouter` from test-utils.
- **Cloudscape duplicates text in DOM**: `TopNavigation` and `BreadcrumbGroup` render the same text in multiple nodes (visible + responsive/aria). Use `getAllByText` instead of `getByText` in tests.
