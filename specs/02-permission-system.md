# Spec: Permission System

## Overview

Dynamic permission system where UI elements are shown/hidden based on the authenticated user's permissions. Permissions map 1:1 to Cognito API operations. The system must be completely dynamic — no hardcoded role checks.

## User Stories

- As an admin with full access, I want to see all features available.
- As a restricted user, I want to only see the features I have access to, with no broken links or disabled states for things I cannot access.
- As a developer, I want to define permissions declaratively so adding a new API operation automatically integrates with the permission system.

## Acceptance Criteria

- [ ] Permission type defined as a union of all 122 Cognito API operation names (e.g., `"CreateUserPool" | "AdminCreateUser" | ...`)
- [ ] `PermissionProvider` context wraps the app and provides the current user's permission set
- [ ] `usePermissions()` hook returns: `hasPermission(op)`, `hasAnyPermission(ops[])`, `hasAllPermissions(ops[])`
- [ ] `<PermissionGate permission="AdminCreateUser">` component conditionally renders children
- [ ] `<PermissionGate anyOf={["ListUsers", "AdminGetUser"]}>` for OR logic
- [ ] `<PermissionGate allOf={["CreateGroup", "ListGroups"]}>` for AND logic
- [ ] Navigation items automatically hidden when user lacks relevant permissions
- [ ] Route-level guards: if a user navigates directly to a URL they lack permission for, redirect to a "not authorized" page
- [ ] Permission set is fetched at login time and cached in TanStack Query
- [ ] MSW mock returns a configurable permission set (default: all permissions granted)
- [ ] Helper to derive navigation visibility from permission config (not manual per-item checks)
- [ ] Unit tests: PermissionGate renders/hides correctly for each logic type
- [ ] Unit tests: usePermissions hook returns correct values
- [ ] Unit tests: navigation filtering works for various permission sets
- [ ] Integration test: restricted user cannot see restricted nav items or access restricted routes

## Technical Constraints

- Permissions are defined as a `Set<CognitoPermission>` — never an array for lookups
- The permission type union must be generated/maintained in one place (`src/types/permissions.ts`)
- No hardcoded role names like "admin" or "viewer" — everything is operation-based
- Components must never import permission checking logic directly; always go through the hook or gate
- The permission provider must be mockable in tests without MSW
