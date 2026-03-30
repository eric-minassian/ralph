# Spec: Core Infrastructure

## Overview

Foundation of the application: Vite + React + TypeScript project with strict configuration, TanStack Router for routing, TanStack Query for server state, Cloudscape Design System for UI, and MSW for API mocking during development.

## Technical Stack

- **Build**: Vite
- **Framework**: React 18+
- **Language**: TypeScript (strict mode, no `any`, `!`, `unknown`, `as`)
- **Routing**: TanStack Router (file-based routing)
- **Server State**: TanStack Query
- **UI Library**: Cloudscape Design System (`@cloudscape-design/components`, `@cloudscape-design/global-styles`)
- **API Mocking**: MSW (Mock Service Worker) v2
- **Unit/Integration Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **i18n**: react-i18next + i18next
- **Package Manager**: pnpm

## Acceptance Criteria

- [ ] Vite project initialized with React + TypeScript template
- [ ] `tsconfig.json` has `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
- [ ] ESLint configured with `@typescript-eslint/strict-type-checked` and rules banning `any`, explicit `unknown`, non-null assertions, and type assertions
- [ ] TanStack Router configured with file-based routing (`src/routes/`)
- [ ] TanStack Query configured with a `QueryClient` provider at app root
- [ ] Cloudscape global styles applied, `@cloudscape-design/components` installed
- [ ] MSW configured with browser worker (`src/mocks/browser.ts`) and node handler (`src/mocks/server.ts`)
- [ ] MSW starts conditionally: only when `VITE_ENABLE_MOCKS=true` env variable is set
- [ ] MSW handlers organized in `src/mocks/handlers/` directory, one file per API domain
- [ ] All environment variables typed in `src/vite-env.d.ts`
- [ ] `pnpm run dev` starts the app successfully
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] `pnpm run lint` passes with zero errors
- [ ] `pnpm run test` runs vitest successfully
- [ ] `pnpm run test:e2e` runs playwright successfully

## Technical Constraints

- TypeScript strict mode is non-negotiable. Every type must be explicitly defined.
- No escape hatches: no `any`, no `as` type assertions, no `!` non-null assertions, no untyped `unknown`. Use type guards and proper narrowing instead.
- All API response types must be derived from AWS SDK types (`@aws-sdk/client-cognito-identity-provider`)
- MSW handlers must be swappable — removing MSW setup should make the app call real AWS APIs with zero code changes to components or hooks
- File-based routing: route files live in `src/routes/` and are auto-discovered by TanStack Router

## Out of Scope

- Actual AWS credential management (handled by SDK defaults / environment)
- Deployment configuration
- CI/CD pipelines
