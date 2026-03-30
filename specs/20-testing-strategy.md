# Spec: Testing Strategy

## Overview

Comprehensive testing strategy following the testing pyramid: many unit tests, fewer integration tests, fewest E2E tests. Every component, hook, and utility must be tested. Coverage targets are strict.

## Testing Pyramid

### Unit Tests (Vitest + React Testing Library)
**Target: highest volume, fastest execution**

- Every React component has a corresponding `.test.tsx` file
- Every custom hook has a corresponding `.test.ts` file
- Every utility function has a corresponding `.test.ts` file
- Tests are co-located: `ComponentName.tsx` → `ComponentName.test.tsx`
- Focus: component rendering, user interactions, state changes, edge cases
- Mock external dependencies (API hooks, i18n, router) at the module level
- Do NOT mock internal component logic

### Integration Tests (Vitest + MSW)
**Target: moderate volume, tests feature flows**

- Located in `src/__tests__/integration/`
- Test complete user flows with MSW providing API responses
- Examples:
  - Create user pool wizard end-to-end
  - User CRUD flow
  - Permission-gated navigation
  - Error handling flows (API failures, validation errors)
- Use real TanStack Query client (not mocked)
- Use real router (not mocked)
- Use MSW server for API layer

### E2E Tests (Playwright)
**Target: lowest volume, tests critical paths**

- Located in `e2e/`
- Test the most critical user journeys in a real browser:
  - User pool CRUD lifecycle
  - User CRUD lifecycle
  - Group management
  - App client management
  - Navigation and permission gating
  - Error recovery
- Run against the dev server with MSW enabled
- Page Object pattern for maintainability
- Each test is independent (no shared state between tests)

## Acceptance Criteria

- [ ] Vitest configured with jsdom environment and React Testing Library
- [ ] Test setup file (`src/test-setup.ts`) configures MSW server, RTL cleanup, i18n mock
- [ ] Playwright configured with base URL pointing to dev server
- [ ] Playwright uses page object models in `e2e/pages/`
- [ ] Coverage thresholds configured in vitest:
  - Statements: 80%
  - Branches: 80%
  - Functions: 80%
  - Lines: 80%
- [ ] `pnpm run test` runs all unit + integration tests
- [ ] `pnpm run test:coverage` generates coverage report
- [ ] `pnpm run test:e2e` runs Playwright tests
- [ ] Every component file has a test file
- [ ] Every hook file has a test file
- [ ] MSW handlers are shared between integration tests and E2E dev server
- [ ] Test utilities in `src/test-utils/`:
  - `renderWithProviders()` — wraps component in QueryClient, Router, i18n, PermissionProvider
  - `createMockPermissions()` — helper to create permission sets for testing
  - `createTestQueryClient()` — creates a QueryClient configured for testing (no retries, no cache time)
- [ ] Playwright global setup starts the dev server
- [ ] Playwright tests use `expect` assertions with meaningful error messages

## Technical Constraints

- Unit tests must not make network requests — use MSW or module mocks
- Integration tests use MSW server (not browser worker)
- E2E tests run against the full app with MSW browser worker
- Tests must be deterministic — no random data without seeds, no timing dependencies
- Test file naming: `*.test.ts` for unit/integration, `*.spec.ts` for E2E
- No `test.skip` or `test.todo` in committed code — either implement or don't add
- Snapshot tests are discouraged — prefer explicit assertions
- Use `userEvent` (not `fireEvent`) in RTL tests for realistic user interaction simulation

## Out of Scope

- Visual regression testing
- Performance testing
- Load testing
