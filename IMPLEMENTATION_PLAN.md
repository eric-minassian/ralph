# Implementation Plan

Generated: 2026-03-30
Status: 19 of 27 tasks complete

## Overview

Cognito Manager is a greenfield React + TypeScript application for managing AWS Cognito User Pools. The codebase is currently empty (no `src/` directory). All 21 specs must be implemented from scratch. The plan is organized into layers: foundation, shell, and features, respecting the dependency graph.

---

## Task List

### TASK-001: Project Scaffolding & Core Infrastructure
- **Spec**: `specs/00-core-infrastructure.md`
- **Status**: done
- **Priority**: 1
- **Description**: Initialize the Vite + React + TypeScript project. Install all dependencies (Cloudscape, TanStack Router, TanStack Query, AWS SDK, MSW, react-i18next, Vitest, Playwright, RTL). Configure `tsconfig.json` with strict settings (`strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). Configure ESLint with `@typescript-eslint/strict-type-checked` and rules banning `any`, `as`, `!`, untyped `unknown`. Set up TanStack Router with file-based routing (`src/routes/`). Set up TanStack Query provider at app root. Apply Cloudscape global styles. Create `src/vite-env.d.ts` with typed env vars. Add pnpm scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `test:coverage`.
- **Acceptance criteria**:
  - `pnpm install` succeeds
  - `pnpm run dev` starts the app
  - `pnpm run typecheck` passes
  - `pnpm run lint` passes
  - `pnpm run test` runs (even with no tests yet)
  - tsconfig has all three strict flags
  - ESLint has bans on `any`, `as`, `!`
  - TanStack Router file-based routing wired up
  - TanStack Query provider at app root
  - Cloudscape global styles imported
- **Files likely touched**: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `.eslintrc.cjs`/`eslint.config.js`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/routes/__root.tsx`, `src/routeTree.gen.ts`, `.gitignore`
- **Dependencies**: none
- **Notes**: Use `pnpm create vite` as starting point. TanStack Router file-based routing requires the `@tanstack/router-plugin/vite` Vite plugin for route generation.

---

### TASK-002: Testing Infrastructure
- **Spec**: `specs/20-testing-strategy.md`
- **Status**: done
- **Priority**: 1
- **Description**: Configure Vitest with jsdom environment and React Testing Library. Create `src/test-setup.ts` with MSW server setup, RTL cleanup, and i18n mock. Create test utilities in `src/test-utils/`: `renderWithProviders()` (wraps in QueryClient, Router, i18n, PermissionProvider), `createMockPermissions()`, `createTestQueryClient()` (no retries, no cache). Configure Playwright with base URL and page object model structure in `e2e/pages/`. Set coverage thresholds at 80% for statements/branches/functions/lines.
- **Acceptance criteria**:
  - `pnpm run test` runs Vitest with jsdom
  - `src/test-setup.ts` exists and configures MSW server + RTL
  - `src/test-utils/renderWithProviders.tsx` exists
  - `src/test-utils/createTestQueryClient.ts` exists
  - `src/test-utils/createMockPermissions.ts` exists
  - Playwright config exists with dev server baseURL
  - `e2e/pages/` directory structure created
  - Coverage thresholds configured
  - A sample smoke test passes to validate the setup
- **Files likely touched**: `vitest.config.ts`, `src/test-setup.ts`, `src/test-utils/renderWithProviders.tsx`, `src/test-utils/createTestQueryClient.ts`, `src/test-utils/createMockPermissions.ts`, `src/test-utils/index.ts`, `playwright.config.ts`, `e2e/pages/.gitkeep`
- **Dependencies**: TASK-001
- **Notes**: Test utilities need stubs for PermissionProvider and i18n that will be filled in by TASK-003 and TASK-005. Use minimal placeholder implementations initially.

---

### TASK-003: Internationalization Setup
- **Spec**: `specs/03-internationalization.md`
- **Status**: done
- **Priority**: 1
- **Description**: Configure react-i18next with i18next. Set up translation file structure in `src/locales/en/`. Create initial namespace files: `common.json`, `navigation.json`, `errors.json`, `validation.json`. Configure language detection from localStorage with English fallback. Set up Cloudscape i18n provider integration. Add language selector placeholder. Configure `react/jsx-no-literals` ESLint rule (or equivalent convention).
- **Acceptance criteria**:
  - `useTranslation()` works in components
  - `src/locales/en/common.json` exists with basic keys
  - `src/locales/en/navigation.json` exists
  - Namespaced keys work: `t('navigation:sidebar.userPools')`
  - Fallback to English works
  - Language persisted to localStorage
  - Cloudscape i18n provider wired up
- **Files likely touched**: `src/i18n.ts`, `src/locales/en/common.json`, `src/locales/en/navigation.json`, `src/locales/en/errors.json`, `src/locales/en/validation.json`, eslint config update
- **Dependencies**: TASK-001
- **Notes**: Only English translations needed initially. Each subsequent feature task will add its own namespace file. Add all 18 namespace files listed in spec as empty `{}` initially so imports don't fail.

---

### TASK-004: API Client & MSW Foundation
- **Spec**: `specs/04-api-client-and-mocking.md`
- **Status**: done
- **Priority**: 1
- **Description**: Create `src/api/client.ts` with a single `CognitoIdentityProviderClient` instance reading from env vars. Create `src/api/queryKeys.ts` with structured query key factory. Set up MSW with browser worker (`src/mocks/browser.ts`) and node server (`src/mocks/server.ts`). Conditional MSW startup gated on `VITE_ENABLE_MOCKS=true`. Create handler directory structure (`src/mocks/handlers/`) and factory directory (`src/mocks/factories/`). Create base mock store pattern in `src/mocks/stores/` for in-memory CRUD state.
- **Acceptance criteria**:
  - `src/api/client.ts` exports configured `CognitoIdentityProviderClient`
  - `src/api/queryKeys.ts` exports query key factory with consistent structure `['cognito', domain, operation, ...params]`
  - MSW browser worker starts when `VITE_ENABLE_MOCKS=true`
  - MSW does NOT start when env var is false/absent
  - `src/mocks/handlers/index.ts` aggregates all domain handlers
  - `src/mocks/stores/` has a base store utility
  - `src/mocks/factories/` directory exists
  - Dev server starts with mocking enabled
- **Files likely touched**: `src/api/client.ts`, `src/api/queryKeys.ts`, `src/mocks/browser.ts`, `src/mocks/server.ts`, `src/mocks/handlers/index.ts`, `src/mocks/stores/baseStore.ts`, `src/mocks/factories/index.ts`, `src/main.tsx` (MSW startup), `.env`, `.env.example`
- **Dependencies**: TASK-001
- **Notes**: The SDK sends POST requests to the Cognito endpoint with `X-Amz-Target` header for operation routing. MSW handlers must intercept based on this header pattern. Create a helper to match `X-Amz-Target: AWSCognitoIdentityProviderService.{OperationName}`.

---

### TASK-005: Permission System
- **Spec**: `specs/02-permission-system.md`
- **Status**: done
- **Priority**: 2
- **Description**: Define the `CognitoPermission` type as a union of all 122 Cognito API operation names in `src/types/permissions.ts`. Create `PermissionProvider` context that holds a `Set<CognitoPermission>`. Create `usePermissions()` hook with `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()`. Create `<PermissionGate>` component with `permission`, `anyOf`, `allOf` props. Add route-level guards that redirect to a "not authorized" page. Create MSW handler for permissions endpoint (configurable mock). Update test utilities with `createMockPermissions()`.
- **Acceptance criteria**:
  - `CognitoPermission` union type has all 122 operations
  - `PermissionProvider` provides permission set via context
  - `usePermissions()` hook returns correct helpers
  - `<PermissionGate permission="X">` renders/hides children correctly
  - `<PermissionGate anyOf={[...]}>` and `allOf={[...]}` work
  - Route guard redirects unauthorized access
  - "Not Authorized" page exists
  - Unit tests for hook, gate (all logic types), and route guard
  - Provider is mockable in tests without MSW
- **Files likely touched**: `src/types/permissions.ts`, `src/contexts/PermissionProvider.tsx`, `src/hooks/usePermissions.ts`, `src/components/PermissionGate.tsx`, `src/routes/not-authorized.tsx`, `src/test-utils/createMockPermissions.ts` (update), unit test files
- **Dependencies**: TASK-001, TASK-002
- **Notes**: The permission set is fetched at login time. For now, the mock returns all permissions. The 122 operations can be sourced from the AWS SDK type definitions or the Cognito API reference.

---

### TASK-006: Layout & Navigation Shell
- **Spec**: `specs/01-layout-and-navigation.md`
- **Status**: done
- **Priority**: 2
- **Description**: Create the app shell using Cloudscape `AppLayout`. Implement `TopNavigation` with app title and user menu (profile, sign out, language selector). Implement data-driven `SideNavigation` with sections for all API domains (User Pools, Users, Groups, App Clients, Identity Providers, Domains, Resource Servers, Branding, Security, Terms of Service). Wire permission-based navigation filtering using the permission system. Implement `BreadcrumbGroup` auto-generated from current TanStack Router route. Create a `Flashbar`-based notification system (context/store with add/dismiss). Wire up help panel integration.
- **Acceptance criteria**:
  - Cloudscape `AppLayout` is the root layout
  - `TopNavigation` shows app title, user menu
  - `SideNavigation` renders all sections from spec
  - Nav items hidden when user lacks permissions
  - Active nav item highlighted based on current route
  - Breadcrumbs auto-generated from route hierarchy
  - Flashbar notification system works (success, error, info, warning, in-progress)
  - All strings use i18n keys
  - Navigation collapses on small viewports (Cloudscape default)
  - Unit tests: nav rendering with different permissions
  - Unit tests: breadcrumb generation
  - Unit tests: notification add/dismiss
- **Files likely touched**: `src/components/Layout/AppLayout.tsx`, `src/components/Layout/TopNav.tsx`, `src/components/Layout/SideNav.tsx`, `src/components/Layout/Breadcrumbs.tsx`, `src/contexts/NotificationProvider.tsx`, `src/hooks/useNotifications.ts`, `src/config/navigation.ts`, `src/routes/__root.tsx` (update), `src/locales/en/navigation.json` (update), unit test files
- **Dependencies**: TASK-003, TASK-005
- **Notes**: Navigation config should be a data structure mapping nav items to required permissions. The navigation helper derives visibility from the config without manual per-item checks.

---

### TASK-007: User Pool Hooks, MSW Handlers & List Page
- **Spec**: `specs/04-api-client-and-mocking.md`, `specs/05-user-pool-management.md`
- **Status**: done
- **Priority**: 3
- **Description**: Create `src/api/hooks/useUserPools.ts` with TanStack Query hooks for all user pool operations: `useListUserPools`, `useDescribeUserPool`, `useCreateUserPool`, `useUpdateUserPool`, `useDeleteUserPool`, `useAddCustomAttributes`, `useGetUserPoolMfaConfig`, `useSetUserPoolMfaConfig`, `useGetLogDeliveryConfiguration`, `useSetLogDeliveryConfiguration`. Create MSW handlers in `src/mocks/handlers/userPools.ts` with in-memory store. Create mock data factory for user pools. Build the User Pool List page with Cloudscape `Table`, `TextFilter`, `Pagination`, `CollectionPreferences`. Create `src/locales/en/userPools.json`.
- **Acceptance criteria**:
  - All user pool query/mutation hooks exported and typed
  - MSW handlers intercept all 10 user pool operations with realistic CRUD behavior
  - Mock store validates duplicates and not-found errors
  - List page renders table with correct columns (Name, ID, Status, Creation Date, Last Modified)
  - TextFilter searches by name
  - Pagination works
  - CollectionPreferences for column visibility and page size
  - Empty state with create action
  - Row click navigates to detail page
  - Mutations invalidate related queries
  - Unit tests for hooks and list page
  - Integration test for list with MSW
- **Files likely touched**: `src/api/hooks/useUserPools.ts`, `src/mocks/handlers/userPools.ts`, `src/mocks/stores/userPoolStore.ts`, `src/mocks/factories/userPool.ts`, `src/routes/user-pools/index.tsx`, `src/locales/en/userPools.json`, test files
- **Dependencies**: TASK-004, TASK-006
- **Notes**: Query keys follow pattern from `queryKeys.ts`. Pagination uses `MaxResults` + `NextToken`.

---

### TASK-008: User Pool Create Wizard
- **Spec**: `specs/05-user-pool-management.md`
- **Status**: done
- **Priority**: 3
- **Description**: Build the multi-step User Pool creation wizard using Cloudscape `Wizard`. Step 1: Pool name, description, deletion protection. Step 2: Sign-in options, attribute requirements. Step 3: Password policy, MFA configuration. Step 4: Email/SMS delivery configuration. Step 5: Review and create. Each step validates before allowing next. On success, show flash notification and redirect to detail page.
- **Acceptance criteria**:
  - 5-step Cloudscape Wizard renders
  - Each step has form validation with i18n error messages
  - Cannot advance to next step with invalid data
  - Review step shows all configured values
  - Create calls `useCreateUserPool` mutation
  - Success notification and redirect to detail
  - Error notification on failure
  - Unit tests for each wizard step validation
  - Integration test: full wizard flow with MSW
- **Files likely touched**: `src/routes/user-pools/create.tsx`, `src/components/UserPools/CreateWizard/` (step components), `src/locales/en/userPools.json` (update), test files
- **Dependencies**: TASK-007
- **Notes**: Complex form — consider breaking wizard steps into separate components for manageability.

---

### TASK-009: User Pool Detail Page
- **Spec**: `specs/05-user-pool-management.md`, `specs/17-mfa-management.md`
- **Status**: done
- **Priority**: 3
- **Description**: Build the User Pool detail page with Cloudscape `Container` sections: General settings (name, ID, ARN, status, dates), Sign-in configuration, Password policy, MFA configuration (with edit via `SetUserPoolMfaConfig` — OFF/OPTIONAL/REQUIRED, SMS/TOTP toggles), Custom attributes (with add via `AddCustomAttributes`), Log delivery configuration, Deletion protection. Each section has an edit button for inline editing or modal. Delete button with modal confirmation (type pool name). Tabs or sub-navigation for related resources (Users, Groups, App Clients, etc.).
- **Acceptance criteria**:
  - Route `/user-pools/:userPoolId` renders detail page
  - All sections display correct data from `useDescribeUserPool`
  - MFA config section: mode selector (OFF/OPTIONAL/REQUIRED), SMS/TOTP toggles, save with confirmation
  - Custom attributes: list existing, add new via `AddCustomAttributes`
  - Log delivery: view and edit
  - Delete modal requires typing pool name
  - Sub-navigation links to Users, Groups, App Clients, etc.
  - User pool context available to child routes
  - Unit tests for each section
  - Integration tests: edit, delete flows with MSW
- **Files likely touched**: `src/routes/user-pools/$userPoolId.tsx` (layout), `src/routes/user-pools/$userPoolId/index.tsx` (detail), `src/components/UserPools/Detail/` (section components), `src/locales/en/userPools.json` (update), `src/locales/en/mfa.json`, test files
- **Dependencies**: TASK-007
- **Notes**: The user pool ID from the route param is used as context for all child routes. MFA management (spec 17 pool-level) is integrated here.

---

### TASK-010: User Hooks, MSW Handlers & List Page
- **Spec**: `specs/04-api-client-and-mocking.md`, `specs/06-user-management.md`
- **Status**: done
- **Priority**: 3
- **Description**: Create `src/api/hooks/useUsers.ts` with TanStack Query hooks for all 26 admin user operations (see spec 06 API list). Create MSW handlers in `src/mocks/handlers/users.ts` with in-memory user store supporting realistic CRUD and state transitions (enabled/disabled, confirmed, etc.). Create mock data factory for users. Build the User List page with Cloudscape `Table` (Username, Email, Phone, Status, Enabled, Created, Last Modified), `PropertyFilter` (filter by status, enabled, email, phone), `Pagination` using `NextToken`-based infinite loading, bulk actions (enable, disable, delete with multi-select), and create user button.
- **Acceptance criteria**:
  - All 26 user operation hooks exported and typed
  - MSW handlers intercept all user operations with realistic state
  - Mock store tracks user attributes, status, groups, devices
  - List page renders with correct columns
  - PropertyFilter works for status, enabled, email, phone
  - Pagination via NextToken / infinite loading
  - Bulk actions work (multi-select + enable/disable/delete)
  - Unit tests for hooks and list page
  - Integration test for list with filtering and pagination
- **Files likely touched**: `src/api/hooks/useUsers.ts`, `src/mocks/handlers/users.ts`, `src/mocks/stores/userStore.ts`, `src/mocks/factories/user.ts`, `src/routes/user-pools/$userPoolId/users/index.tsx`, `src/locales/en/users.json`, test files
- **Dependencies**: TASK-004, TASK-006, TASK-009 (needs user pool context)
- **Notes**: This is the largest hook file with 26 operations. Consider splitting into logical groups (CRUD, auth, attributes, devices, groups, providers, security) within the same file or as sub-modules.

---

### TASK-011: User Create Form
- **Spec**: `specs/06-user-management.md`
- **Status**: done
- **Priority**: 4
- **Description**: Build the Create User form with Cloudscape `Form`. Fields: Username (required), temporary password (optional with auto-generate toggle), email/phone/name (based on pool's required attributes), custom attributes (dynamic fields from pool schema, prefixed `custom:`), send invitation toggle (email/SMS), suppress welcome message option. Validate against the user pool's attribute schema.
- **Acceptance criteria**:
  - Form renders with all required fields
  - Dynamic custom attribute fields based on pool schema
  - Auto-generate password toggle works
  - Validation respects pool attribute requirements
  - Create calls `AdminCreateUser` mutation
  - Success notification and redirect to user detail
  - Unit tests for form validation
  - Integration test: create flow with MSW
- **Files likely touched**: `src/routes/user-pools/$userPoolId/users/create.tsx`, `src/components/Users/CreateUserForm.tsx`, `src/locales/en/users.json` (update), test files
- **Dependencies**: TASK-010
- **Notes**: Dynamic fields require reading the user pool schema. The pool detail from context provides available attributes.

---

### TASK-012: User Detail Page — Overview & Attributes Tabs
- **Spec**: `specs/06-user-management.md`
- **Status**: done
- **Priority**: 4
- **Description**: Build the User Detail page with Cloudscape `Tabs`. Overview tab: username, status, enabled, email verified, phone verified, created, last modified, sub. Attributes tab: key-value table of all user attributes with edit/delete capability for mutable attributes, add custom attribute action. Standard attributes respect mutability settings from pool schema.
- **Acceptance criteria**:
  - Route `/user-pools/:userPoolId/users/:username` renders
  - Overview tab displays all user metadata
  - Attributes tab shows all attributes in key-value table
  - Edit attribute inline or modal
  - Delete attribute with confirmation
  - Add custom attribute
  - Standard attribute mutability respected
  - `custom:` prefixed attributes editable
  - Unit tests for both tabs
  - Integration test: view and edit attributes with MSW
- **Files likely touched**: `src/routes/user-pools/$userPoolId/users/$username.tsx` (layout), `src/routes/user-pools/$userPoolId/users/$username/index.tsx`, `src/components/Users/Detail/OverviewTab.tsx`, `src/components/Users/Detail/AttributesTab.tsx`, test files
- **Dependencies**: TASK-010
- **Notes**: Attribute editing uses `AdminUpdateUserAttributes` and `AdminDeleteUserAttributes`.

---

### TASK-013: User Actions & Security Tab
- **Spec**: `specs/06-user-management.md`, `specs/17-mfa-management.md`
- **Status**: done
- **Priority**: 4
- **Description**: Build the user actions dropdown in the detail page header: Enable/Disable (toggle), Reset password, Set password (with strength indicator), Confirm sign-up, Global sign-out, Delete (type username to confirm). Each action shows a confirmation modal. Build the Security tab: current MFA preferences display (SMS enabled/preferred, TOTP enabled/preferred), edit MFA preferences (toggle SMS/TOTP, set preferred), auth events table (Event ID, Type, Date, Risk, Response, IP) with feedback action (valid/invalid), pagination for auth events.
- **Acceptance criteria**:
  - Action dropdown renders all actions
  - Each action modal has correct inputs and confirmations
  - Set password modal has password strength indicator
  - Delete modal requires typing username
  - All actions call correct mutation hooks
  - Security tab: MFA preferences display and edit
  - Auth events table with columns and pagination
  - Feedback action (valid/invalid) works
  - Unit tests for each action modal
  - Unit tests for security tab
  - Integration test: action flows with MSW
- **Files likely touched**: `src/components/Users/Detail/UserActions.tsx`, `src/components/Users/Detail/SecurityTab.tsx`, `src/components/Users/Detail/AuthEventsTable.tsx`, `src/locales/en/users.json` (update), test files
- **Dependencies**: TASK-012
- **Notes**: Per-user MFA (spec 17) is integrated in the Security tab. Auth events use `AdminListUserAuthEvents` and `AdminUpdateAuthEventFeedback`.

---

### TASK-014: User Groups & Linked Providers Tabs
- **Spec**: `specs/06-user-management.md`
- **Status**: done
- **Priority**: 4
- **Description**: Build the Groups tab in user detail: table of group memberships (Group Name, Description, Precedence, Joined Date) with add user to group action (modal with group search/select via `ListGroups`) and remove from group action with confirmation. Build the Linked Providers tab: table of linked IdPs with provider name, provider type, link/unlink actions. Link provider modal with provider selection and attribute mapping. Unlink with confirmation.
- **Acceptance criteria**:
  - Groups tab: membership table renders
  - Add to group: modal with group search, calls `AdminAddUserToGroup`
  - Remove from group: confirmation, calls `AdminRemoveUserFromGroup`
  - Linked providers tab: table with link/unlink
  - Link provider: calls `AdminLinkProviderForUser`
  - Unlink provider: calls `AdminDisableProviderForUser`
  - Unit tests for both tabs
  - Integration test: add/remove group membership with MSW
- **Files likely touched**: `src/components/Users/Detail/GroupsTab.tsx`, `src/components/Users/Detail/LinkedProvidersTab.tsx`, test files
- **Dependencies**: TASK-012
- **Notes**: Group add modal needs to query available groups. Linked providers tab uses `AdminLinkProviderForUser` and `AdminDisableProviderForUser`.

---

### TASK-015: User Devices & WebAuthn Tabs
- **Spec**: `specs/06-user-management.md`, `specs/15-device-management.md`, `specs/16-webauthn.md`
- **Status**: done
- **Priority**: 4
- **Description**: Build the Devices tab in user detail: table of devices (Device Key, Device Name, Last IP, Last Authenticated, Created, Remembered Status), forget device action with confirmation modal, update device status toggle (remembered/not-remembered), device detail view. Build WebAuthn credentials section (within Security tab or dedicated sub-tab): table (Credential ID, Friendly Name, Created Date, Last Used), delete credential with confirmation, informational note about admin limitations.
- **Acceptance criteria**:
  - Devices tab: table renders with correct columns
  - Forget device with confirmation modal
  - Update device status toggle works
  - Device detail view shows all attributes
  - WebAuthn table renders credentials
  - Delete WebAuthn credential with confirmation
  - Info note: registration is user-initiated
  - Unit tests for device table and actions
  - Unit tests for WebAuthn table
  - Integration tests: device list, forget, update status with MSW
  - Integration tests: WebAuthn list and delete with MSW
- **Files likely touched**: `src/components/Users/Detail/DevicesTab.tsx`, `src/components/Users/Detail/WebAuthnSection.tsx`, `src/mocks/handlers/devices.ts`, `src/mocks/handlers/webauthn.ts`, `src/api/hooks/useDevices.ts`, `src/api/hooks/useWebAuthn.ts`, `src/locales/en/devices.json`, `src/locales/en/webauthn.json`, test files
- **Dependencies**: TASK-012
- **Notes**: Devices and WebAuthn are displayed within user detail, not standalone routes. MSW handlers for device operations and WebAuthn credentials needed.

---

### TASK-016: Group Management
- **Spec**: `specs/07-group-management.md`
- **Status**: done
- **Priority**: 4
- **Description**: Create `src/api/hooks/useGroups.ts` with hooks for `CreateGroup`, `GetGroup`, `UpdateGroup`, `DeleteGroup`, `ListGroups`, `ListUsersInGroup`. Create MSW handlers and mock store. Build Group List page (Table with Name, Description, Precedence, Role ARN, Created, Last Modified; TextFilter; Pagination; create button; row click to detail). Build Create/Edit Group form (Name required/immutable on edit, Description, Role ARN, Precedence). Build Group Detail page (header with edit/delete, Container with all fields, Members table with add/remove user actions, pagination).
- **Acceptance criteria**:
  - All group hooks exported and typed
  - MSW handlers for all 6 group operations
  - List page with table, filter, pagination
  - Create form with validation
  - Edit form (name immutable)
  - Detail page with all fields
  - Members table with add user modal (user search) and remove with confirmation
  - Delete group modal (type name to confirm)
  - Route: `/user-pools/:userPoolId/groups/:groupName`
  - Unit tests for all components
  - Integration tests: CRUD lifecycle + membership with MSW
- **Files likely touched**: `src/api/hooks/useGroups.ts`, `src/mocks/handlers/groups.ts`, `src/mocks/stores/groupStore.ts`, `src/mocks/factories/group.ts`, `src/routes/user-pools/$userPoolId/groups/index.tsx`, `src/routes/user-pools/$userPoolId/groups/create.tsx`, `src/routes/user-pools/$userPoolId/groups/$groupName.tsx`, `src/locales/en/groups.json`, test files
- **Dependencies**: TASK-004, TASK-006, TASK-009
- **Notes**: Membership management uses `AdminAddUserToGroup`/`AdminRemoveUserFromGroup` from user hooks (TASK-010), but can be called from group context too.

---

### TASK-017: App Client Management
- **Spec**: `specs/08-app-client-management.md`
- **Status**: done
- **Priority**: 4
- **Description**: Create `src/api/hooks/useAppClients.ts` with hooks for all 8 app client operations (CRUD + secret management). Create MSW handlers and mock store. Build App Client List page. Build Create/Edit form with: client name, generate secret toggle, auth flows checkboxes, OAuth settings (flows, scopes, callback URLs, logout URLs), token validity (access/ID/refresh with units), read/write attributes, prevent user existence errors, enable token revocation. Build Detail page with all config sections, client ID copy-to-clipboard, client secret section (table of secrets, create new, delete, show-once on creation).
- **Acceptance criteria**:
  - All 8 app client hooks exported and typed
  - MSW handlers for all operations including secret management
  - List page with table, filter, pagination
  - Create/Edit form with all fields and validation
  - Callback URL format validation
  - Token validity range validation
  - Detail page with organized sections
  - Client ID copy-to-clipboard
  - Secret management: create (show once), list, delete
  - Route: `/user-pools/:userPoolId/app-clients/:clientId`
  - Unit tests for form validation and all components
  - Integration tests: CRUD + secret lifecycle with MSW
- **Files likely touched**: `src/api/hooks/useAppClients.ts`, `src/mocks/handlers/appClients.ts`, `src/mocks/stores/appClientStore.ts`, `src/mocks/factories/appClient.ts`, `src/routes/user-pools/$userPoolId/app-clients/` (index, create, $clientId), `src/locales/en/appClients.json`, test files
- **Dependencies**: TASK-004, TASK-006, TASK-009
- **Notes**: Complex form with many fields. Consider organizing into sections/containers. Secret value shown only once is critical UX.

---

### TASK-018: Identity Provider Management
- **Spec**: `specs/09-identity-providers.md`
- **Status**: done
- **Priority**: 5
- **Description**: Create `src/api/hooks/useIdentityProviders.ts` with hooks for all 6 IdP operations. Create MSW handlers and mock store. Build IdP List page. Build dynamic Create/Edit form that renders different fields based on provider type: SAML (metadata URL/upload, attribute mapping), OIDC (client ID/secret, issuer, endpoints, scopes, attribute mapping), Social (client ID/secret, scopes). Build attribute mapping editor (table with IdP→Cognito attribute pairs, add/remove rows). Build Detail page with all config and mapping.
- **Acceptance criteria**:
  - All 6 IdP hooks exported and typed
  - MSW handlers for all operations
  - List page with table (Provider Name, Type, Created, Last Modified)
  - Create button with dropdown for provider type selection
  - Dynamic form per provider type
  - SAML: metadata URL or file upload with XML validation
  - OIDC: all endpoint fields, scopes
  - Social: provider-specific fields
  - Attribute mapping editor works (add/remove/edit rows)
  - Detail page with all sections
  - Route: `/user-pools/:userPoolId/identity-providers/:providerName`
  - Unit tests for dynamic form per type
  - Unit tests for attribute mapping editor
  - Integration tests: CRUD per provider type with MSW
- **Files likely touched**: `src/api/hooks/useIdentityProviders.ts`, `src/mocks/handlers/identityProviders.ts`, `src/mocks/stores/idpStore.ts`, `src/mocks/factories/identityProvider.ts`, `src/routes/user-pools/$userPoolId/identity-providers/` (index, create, $providerName), `src/components/IdentityProviders/AttributeMappingEditor.tsx`, `src/locales/en/identityProviders.json`, test files
- **Dependencies**: TASK-004, TASK-006, TASK-009
- **Notes**: Dynamic form is the key complexity. Consider a form config object per provider type.

---

### TASK-019: Domain Management
- **Spec**: `specs/10-domain-management.md`
- **Status**: done
- **Priority**: 5
- **Description**: Create `src/api/hooks/useDomains.ts` with hooks for `CreateUserPoolDomain`, `DescribeUserPoolDomain`, `UpdateUserPoolDomain`, `DeleteUserPoolDomain`. Create MSW handlers with async domain creation simulation. Build Domain page: show current domain if exists (URL, status, CloudFront distribution), or create form if none. Create form: toggle between Cognito prefix (text + suffix preview) and custom domain (full domain + ACM certificate ARN). Update domain (certificate change). Delete with confirmation. Link to open hosted UI.
- **Acceptance criteria**:
  - All 4 domain hooks exported and typed
  - MSW handlers with realistic async status transitions
  - Domain page shows create form when no domain exists
  - Domain page shows detail when domain exists
  - Cognito prefix mode: input with `.auth.{region}.amazoncognito.com` preview
  - Custom domain mode: domain input + ACM ARN input with validation
  - Pending status with auto-refresh
  - Update and delete work
  - Open hosted UI link
  - Route: `/user-pools/:userPoolId/domain`
  - Unit tests for form and detail
  - Integration tests: create, describe, update, delete with MSW
- **Files likely touched**: `src/api/hooks/useDomains.ts`, `src/mocks/handlers/domains.ts`, `src/mocks/stores/domainStore.ts`, `src/routes/user-pools/$userPoolId/domain.tsx`, `src/locales/en/domains.json`, test files
- **Dependencies**: TASK-004, TASK-006, TASK-009
- **Notes**: Only one domain per pool. Auto-refresh for pending status via TanStack Query `refetchInterval`.

---

### TASK-020: Resource Server Management
- **Spec**: `specs/11-resource-servers.md`
- **Status**: pending
- **Priority**: 5
- **Description**: Create `src/api/hooks/useResourceServers.ts` with hooks for all 5 resource server operations. Create MSW handlers and mock store. Build List page (Table: Name, Identifier, Number of Scopes; TextFilter; create button). Build Create/Edit form (Name, Identifier immutable on edit) with Cloudscape `AttributeEditor` for scopes (each scope: Name + Description). Build Detail page with identifier, name, scopes table, edit/delete.
- **Acceptance criteria**:
  - All 5 resource server hooks exported and typed
  - MSW handlers for all operations
  - List page with table and filter
  - Create/Edit form with scope editor
  - Identifier immutable on edit
  - Scope name uniqueness validation
  - Detail page with scopes table
  - Route: `/user-pools/:userPoolId/resource-servers/:identifier`
  - Unit tests for form, attribute editor, table
  - Integration tests: CRUD lifecycle with MSW
- **Files likely touched**: `src/api/hooks/useResourceServers.ts`, `src/mocks/handlers/resourceServers.ts`, `src/mocks/stores/resourceServerStore.ts`, `src/routes/user-pools/$userPoolId/resource-servers/` (index, create, $identifier), `src/locales/en/resourceServers.json`, test files
- **Dependencies**: TASK-004, TASK-006, TASK-009
- **Notes**: Scopes defined here appear in app client OAuth scope configuration (cross-reference TASK-017).

---

### TASK-021: User Import
- **Spec**: `specs/12-user-import.md`
- **Status**: pending
- **Priority**: 5
- **Description**: Create `src/api/hooks/useUserImport.ts` with hooks for all 6 import operations. Create MSW handlers with async job status simulation. Build Import Jobs List page (Table: Job ID, Name, Status with StatusIndicator, Created, Started, Completed, Users Imported/Skipped/Failed; auto-refresh for in-progress jobs via `refetchInterval`; create button). Build Create Import Job wizard (5 steps: name, download CSV template via GetCSVHeader, file upload, IAM role ARN, review). Build Job Detail page with metadata, progress stats, stop button.
- **Acceptance criteria**:
  - All 6 import hooks exported and typed
  - MSW handlers simulate async job progression
  - List page with status indicators and auto-refresh
  - Create wizard with CSV template download
  - File upload via Cloudscape `FileUpload`
  - Job detail with stop button (for in-progress)
  - Status auto-refreshes while in-progress
  - Route: `/user-pools/:userPoolId/import/:jobId`
  - Unit tests for table, status indicators, wizard
  - Integration tests: create → start → monitor with MSW
- **Files likely touched**: `src/api/hooks/useUserImport.ts`, `src/mocks/handlers/userImport.ts`, `src/mocks/stores/importJobStore.ts`, `src/routes/user-pools/$userPoolId/import/` (index, create, $jobId), `src/locales/en/import.json`, test files
- **Dependencies**: TASK-004, TASK-006, TASK-009
- **Notes**: CSV template download triggers browser file download. Import jobs are inherently async — mock must simulate state transitions over time.

---

### TASK-022: Advanced Security
- **Spec**: `specs/13-advanced-security.md`
- **Status**: pending
- **Priority**: 5
- **Description**: Create `src/api/hooks/useSecurity.ts` with hooks for `DescribeRiskConfiguration`, `SetRiskConfiguration`, `UpdateAuthEventFeedback`, `AdminListUserAuthEvents`, `AdminUpdateAuthEventFeedback`. Create MSW handlers. Build Risk Configuration page with Container sections: Compromised credentials (risk actions per event type), Account takeover protection (risk actions per risk level, notifications), IP exceptions (always-allow/block CIDR lists with validation). Each section editable with save/cancel. Client ID selector for per-client scoping. Build Auth Events table with PropertyFilter (risk level, event type, date range), feedback action, detail modal.
- **Acceptance criteria**:
  - All 5 security hooks exported and typed
  - MSW handlers for all operations
  - Risk config: compromised credentials section
  - Risk config: account takeover section
  - Risk config: IP exceptions with CIDR validation (IPv4 + IPv6)
  - Pool-level vs per-client selector
  - Auth events table with filtering and pagination
  - Feedback action (valid/invalid) per event
  - Route: `/user-pools/:userPoolId/security`
  - Unit tests for forms and validation
  - Unit tests for auth events table
  - Integration tests with MSW
- **Files likely touched**: `src/api/hooks/useSecurity.ts`, `src/mocks/handlers/security.ts`, `src/mocks/stores/securityStore.ts`, `src/routes/user-pools/$userPoolId/security.tsx`, `src/components/Security/RiskConfig/`, `src/components/Security/AuthEventsTable.tsx`, `src/locales/en/security.json`, test files
- **Dependencies**: TASK-004, TASK-006, TASK-009
- **Notes**: CIDR validation is a key technical detail. Auth events use infinite query with `NextToken`.

---

### TASK-023: Branding
- **Spec**: `specs/14-branding.md`
- **Status**: pending
- **Priority**: 6
- **Description**: Create `src/api/hooks/useBranding.ts` with hooks for all 7 branding operations (managed login + legacy UI). Create MSW handlers. Build Branding page with: scope selector (pool-level or per-client), managed login branding form (logo upload, background color picker, button color picker, CSS textarea), live preview panel, save/reset/delete actions. Build legacy UI customization section (CSS textarea, image upload, deprecation note). File validation for images (PNG/JPG/SVG, size limits).
- **Acceptance criteria**:
  - All 7 branding hooks exported and typed
  - MSW handlers for all operations
  - Scope selector: pool-level vs per-client
  - Logo upload with file type/size validation
  - Color pickers for background and button colors
  - CSS customization textarea
  - Live preview panel
  - Save, reset to defaults, delete actions
  - Legacy UI section with deprecation note
  - Route: `/user-pools/:userPoolId/branding`
  - Unit tests for form and file upload
  - Integration tests: CRUD lifecycle with MSW
- **Files likely touched**: `src/api/hooks/useBranding.ts`, `src/mocks/handlers/branding.ts`, `src/routes/user-pools/$userPoolId/branding.tsx`, `src/components/Branding/`, `src/locales/en/branding.json`, test files
- **Dependencies**: TASK-004, TASK-006, TASK-009
- **Notes**: Preview should render in iframe or styled container. Color picker may need a third-party component or custom implementation.

---

### TASK-024: Terms of Service Management
- **Spec**: `specs/19-terms-of-service.md`
- **Status**: pending
- **Priority**: 6
- **Description**: Create `src/api/hooks/useTerms.ts` with hooks for all 5 terms operations. Create MSW handlers and mock store. Build Terms List page (Table: Terms ID, Version, Status, Created, Last Modified; TextFilter; create button). Build Create/Edit form (Version label, Terms text via Textarea/CodeEditor, Status draft/active). Build Detail page (full content, metadata, edit/delete). Delete with confirmation.
- **Acceptance criteria**:
  - All 5 terms hooks exported and typed
  - MSW handlers for all operations
  - List page with table and filter
  - Create/Edit form with validation
  - Detail page with full content display
  - Delete with confirmation
  - Route: `/user-pools/:userPoolId/terms/:termsId`
  - Unit tests for form, table, detail
  - Integration tests: CRUD lifecycle with MSW
- **Files likely touched**: `src/api/hooks/useTerms.ts`, `src/mocks/handlers/terms.ts`, `src/mocks/stores/termsStore.ts`, `src/routes/user-pools/$userPoolId/terms/` (index, create, $termsId), `src/locales/en/terms.json`, test files
- **Dependencies**: TASK-004, TASK-006, TASK-009
- **Notes**: Terms content may be long — use expandable section or dedicated view.

---

### TASK-025: Resource Tagging
- **Spec**: `specs/18-tagging.md`
- **Status**: pending
- **Priority**: 6
- **Description**: Create `src/api/hooks/useTags.ts` with hooks for `ListTagsForResource`, `TagResource`, `UntagResource`. Create MSW handlers. Build a reusable Tags section component using Cloudscape `TagEditor`. Integrate into User Pool detail page. Display existing tags, add tag (key max 128 chars, value max 256 chars), remove tag with confirmation. Bulk editing (add/remove multiple, save all at once). Validation: key uniqueness, character limits, `aws:` prefix reserved.
- **Acceptance criteria**:
  - All 3 tag hooks exported and typed
  - MSW handlers for tag operations
  - Cloudscape `TagEditor` component used
  - Tags section renders on user pool detail page
  - Add, edit, remove tags
  - Bulk editing with single save
  - Validation: uniqueness, length, reserved prefix
  - Max 50 tags enforced
  - Unit tests for tag editor and validation
  - Integration tests: list, add, remove with MSW
- **Files likely touched**: `src/api/hooks/useTags.ts`, `src/mocks/handlers/tags.ts`, `src/components/Tags/TagSection.tsx`, `src/routes/user-pools/$userPoolId/index.tsx` (integrate), `src/locales/en/tags.json`, test files
- **Dependencies**: TASK-009
- **Notes**: Tags section is embedded in resource detail pages, not a standalone route. Component should be reusable for any resource with an ARN.

---

### TASK-026: E2E Tests — Critical Paths
- **Spec**: `specs/20-testing-strategy.md`, all feature specs
- **Status**: pending
- **Priority**: 7
- **Description**: Write Playwright E2E tests for critical user journeys. Create page object models in `e2e/pages/` for: UserPoolsPage, UserPoolDetailPage, UsersPage, UserDetailPage, GroupsPage, AppClientsPage, NavigationPage. Tests: User Pool CRUD lifecycle (create → view → edit → delete), User CRUD lifecycle (create → view → edit attributes → manage groups → delete), Group management (create → add users → remove → delete), App client management (create → configure → manage secrets → delete), Navigation and permission gating, Error recovery scenarios.
- **Acceptance criteria**:
  - Page object models for all critical pages
  - E2E: User pool full lifecycle
  - E2E: User full lifecycle
  - E2E: Group management lifecycle
  - E2E: App client management lifecycle
  - E2E: Navigation renders correctly, permission gating works
  - E2E: Error recovery (API failure handling)
  - Each test independent (no shared state)
  - `pnpm run test:e2e` runs all E2E tests
  - Tests use meaningful assertions
  - Tests run against dev server with MSW
- **Files likely touched**: `e2e/pages/UserPoolsPage.ts`, `e2e/pages/UsersPage.ts`, `e2e/pages/GroupsPage.ts`, `e2e/pages/AppClientsPage.ts`, `e2e/pages/NavigationPage.ts`, `e2e/user-pools.spec.ts`, `e2e/users.spec.ts`, `e2e/groups.spec.ts`, `e2e/app-clients.spec.ts`, `e2e/navigation.spec.ts`, `e2e/error-recovery.spec.ts`
- **Dependencies**: TASK-007 through TASK-017 (all core feature tasks)
- **Notes**: E2E tests are the final validation layer. Run against the full app with MSW browser worker. Playwright global setup should start the dev server.

---

### TASK-027: Remaining MSW Handlers & Polish
- **Spec**: `specs/04-api-client-and-mocking.md`
- **Status**: pending
- **Priority**: 7
- **Description**: Audit all 122 Cognito API operations against implemented MSW handlers. Fill in any missing handlers (operations not covered by feature tasks, edge cases). Ensure all handlers maintain realistic validation (duplicate name errors, not-found errors, invalid parameter errors). Verify that disabling MSW (`VITE_ENABLE_MOCKS=false`) results in the app calling real AWS APIs with zero code changes. Final lint, typecheck, and test pass.
- **Acceptance criteria**:
  - All 122 Cognito API operations have MSW handlers
  - All handlers return realistic error responses for invalid inputs
  - `VITE_ENABLE_MOCKS=false` — app calls real AWS
  - `pnpm run typecheck` passes
  - `pnpm run lint` passes
  - `pnpm run test` passes (all unit + integration)
  - `pnpm run test:e2e` passes
  - No `test.skip` or `test.todo` in codebase
- **Files likely touched**: `src/mocks/handlers/` (various), `src/mocks/stores/` (various), any files needing fixes from audit
- **Dependencies**: All previous tasks
- **Notes**: This is the final quality gate. Any operations not naturally covered by features (e.g., `AdminInitiateAuth`, `AdminRespondToAuthChallenge`) need stub handlers at minimum.

---

## Dependency Graph

```
TASK-001 (Core Infrastructure)
├── TASK-002 (Testing Infrastructure)
├── TASK-003 (i18n Setup)
│   └── TASK-006 (Layout & Navigation) ← also depends on TASK-005
├── TASK-004 (API Client & MSW Foundation)
│   ├── TASK-007 (User Pool Hooks + List) ← also depends on TASK-006
│   │   ├── TASK-008 (User Pool Create Wizard)
│   │   └── TASK-009 (User Pool Detail)
│   │       ├── TASK-010 (User Hooks + List)
│   │       │   ├── TASK-011 (User Create)
│   │       │   ├── TASK-012 (User Detail Overview + Attributes)
│   │       │   │   ├── TASK-013 (User Actions + Security)
│   │       │   │   ├── TASK-014 (User Groups + Providers)
│   │       │   │   └── TASK-015 (User Devices + WebAuthn)
│   │       ├── TASK-016 (Group Management)
│   │       ├── TASK-017 (App Client Management)
│   │       ├── TASK-018 (Identity Providers)
│   │       ├── TASK-019 (Domain Management)
│   │       ├── TASK-020 (Resource Servers)
│   │       ├── TASK-021 (User Import)
│   │       ├── TASK-022 (Advanced Security)
│   │       ├── TASK-023 (Branding)
│   │       ├── TASK-024 (Terms of Service)
│   │       └── TASK-025 (Resource Tagging)
│   └── [TASK-016..025 also depend on TASK-004 + TASK-006]
└── TASK-005 (Permission System) ← also depends on TASK-002

TASK-026 (E2E Tests) ← depends on TASK-007 through TASK-017
TASK-027 (MSW Polish) ← depends on all previous tasks
```

## Execution Order (suggested build iterations)

| Iteration | Tasks | Parallelizable |
|-----------|-------|----------------|
| 1 | TASK-001 | No |
| 2 | TASK-002, TASK-003, TASK-004 | Yes (all depend only on TASK-001) |
| 3 | TASK-005 | No (needs TASK-002) |
| 4 | TASK-006 | No (needs TASK-003 + TASK-005) |
| 5 | TASK-007 | No (needs TASK-004 + TASK-006) |
| 6 | TASK-008, TASK-009 | Yes (both depend only on TASK-007) |
| 7 | TASK-010, TASK-016, TASK-017 | Yes (all depend on TASK-009) |
| 8 | TASK-011, TASK-012, TASK-018, TASK-019, TASK-020 | Yes |
| 9 | TASK-013, TASK-014, TASK-015, TASK-021, TASK-022 | Yes |
| 10 | TASK-023, TASK-024, TASK-025 | Yes |
| 11 | TASK-026 | No |
| 12 | TASK-027 | No |
