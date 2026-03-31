# Ralph — Specs Generation Mode

You are an autonomous agent tasked with generating a complete set of requirement specs for a frontend application.

---

## Inputs

### API Reference

<!-- Replace this URL with your API docs -->

API_URL: https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_Operations.html

### Tech Stack

- Build: Vite
- Framework: React 19+
- Language: TypeScript (strict mode — no `any`, `!`, `unknown`, `as`)
- Routing: TanStack Router (file-based)
- Server State: TanStack Query
- Forms: react-hook-form (with proper TypeScript generics, no `any` form values)
- UI Library: Cloudscape Design System
  - Docs: https://cloudscape.design/llms.txt
  - Components: https://cloudscape.design/components/index.html.md
- API Mocking: MSW v2 (Mock Service Worker)
- Unit/Integration Tests: Vitest + React Testing Library
- E2E Tests: Playwright
- i18n: react-i18next
- Package Manager: pnpm

### Core Requirements

1. 100% API coverage — every API operation gets a UI surface
2. Strict typing — no escape hatches (`any`, `as`, `!`, untyped `unknown`)
3. Dynamic permissions — UI elements shown/hidden based on user permissions, 1:1 with API operations
4. Internationalization — all user-facing strings externalized via react-i18next, no hardcoded strings
5. Testing pyramid — many unit tests (vitest), integration tests (vitest + MSW), E2E tests (playwright)
6. API mocking via MSW — all APIs mocked for development, removable by toggling one env var
7. Simple but powerful UI — Cloudscape components, optimal UX, not just CRUD forms
8. react-hook-form for all forms — with Cloudscape component integration, validation, and error display

---

## Phase 0 — Research

0a. Fetch the API_URL above. Extract EVERY API operation. Group them by logical domain (e.g., resource management, user management, configuration, etc.).
0b. Fetch the Cloudscape llms.txt to understand available components and patterns.
0c. Count the total number of API operations. This count must appear in the specs.

## Phase 1 — Generate Core Specs

Create these spec files in `specs/`:

### `00-core-infrastructure.md`

Project foundation: Vite, React, TypeScript strict config, TanStack Router, TanStack Query, Cloudscape, MSW, react-hook-form, ESLint rules banning type escape hatches. Include all packages to install.

### `01-layout-and-navigation.md`

App shell: Cloudscape AppLayout, SideNavigation (data-driven, sections per API domain), TopNavigation, BreadcrumbGroup (auto-generated from routes), Flashbar (notification system). Navigation items dynamically filtered by permissions.

### `02-permission-system.md`

Permission type = union of all API operation names. PermissionProvider context, usePermissions() hook, PermissionGate component (single/anyOf/allOf), route-level guards, MSW mock returns configurable permission set.

### `03-internationalization.md`

react-i18next setup, namespaced translation files per feature domain, no string literals in JSX, date/number formatting, language selector, Cloudscape i18n provider integration.

### `04-api-client-and-mocking.md`

API client setup, TanStack Query hooks (one file per API domain), query key structure, mutation invalidation, MSW handlers (one file per API domain), mock data stores with realistic CRUD behavior, mock data factories. Must cover ALL API operations.

### `05-forms-infrastructure.md`

react-hook-form integration with Cloudscape components. Reusable form field wrapper that connects react-hook-form Controller to Cloudscape Input, Select, Multiselect, Toggle, DatePicker, Textarea, etc. Typed form schemas (no `any` form values). Validation patterns: required, pattern, min/max, custom async validators. Error message display using Cloudscape FormField error text. Shared validation utilities.

### `20-testing-strategy.md`

Testing pyramid: unit tests (co-located, every component/hook/utility), integration tests (feature flows with MSW), E2E tests (Playwright with page objects). Coverage thresholds (80%+). Test utilities: renderWithProviders, createMockPermissions, createTestQueryClient.

## Phase 2 — Generate Domain Specs

For EACH API domain group identified in Phase 0, create a spec file:

### Naming: `{NN}-{domain-name}.md` (numbered 06-19 or as many as needed)

Each domain spec MUST include:

1. **Overview**: what this domain does
2. **APIs Covered**: explicit list of every API operation in this domain
3. **User Stories**: what the admin wants to accomplish
4. **Acceptance Criteria** with checkboxes:
   - **List view**: Cloudscape Table with TextFilter/PropertyFilter, Pagination, CollectionPreferences, empty states, create action
   - **Create/Edit**: react-hook-form with Cloudscape components, multi-step Wizard for complex resources, validation on every field
   - **Detail view**: Cloudscape Container sections, tabs for sub-resources, action dropdown for operations (enable/disable/delete/etc.)
   - **Delete**: confirmation Modal (type resource name to confirm)
   - **Testing**: unit tests, integration tests, E2E test for the critical path
5. **Technical Constraints**: routes, Cloudscape components to use, form validation rules

### Rules for domain specs:

- Every API operation MUST appear in at least one spec's "APIs Covered" section
- If an API operation is used across multiple domains (e.g., tagging), note it in both specs
- Use Cloudscape Wizard for any create flow with 3+ configuration sections
- Use react-hook-form for ALL forms — never uncontrolled inputs
- All form labels, placeholders, error messages, and help text must be i18n keys
- Include pagination handling for any list API that supports NextToken or similar

## Phase 3 — Update AGENTS.md

Update `AGENTS.md` with:

- The real tech stack (including react-hook-form)
- Reference doc URLs for the API and Cloudscape
- Build/verify commands
- TypeScript and i18n rules

## Phase 4 — Verify Completeness

Before finishing:

1. Count all API operations from Phase 0
2. Grep all spec files for each operation name
3. Confirm every operation appears in at least one spec's "APIs Covered"
4. If any are missing, add them to the appropriate spec

Output a summary:

```
Total API operations: N
Specs generated: M
Coverage: N/N (100%)
```

---

## Stop Condition

When all specs are written and verified, output:

```
<ralph>COMPLETE</ralph>
```
