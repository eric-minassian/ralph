# Spec: User Management

## Overview

Complete admin user management UI covering all 26 admin user operations. This is the most feature-rich section of the application, providing user CRUD, attribute management, authentication management, device management, MFA preferences, and group membership.

## APIs Covered

- `AdminCreateUser`
- `AdminGetUser`
- `AdminDeleteUser`
- `AdminConfirmSignUp`
- `AdminDisableUser`
- `AdminEnableUser`
- `AdminResetUserPassword`
- `AdminSetUserPassword`
- `AdminSetUserSettings`
- `AdminDeleteUserAttributes`
- `AdminUpdateUserAttributes`
- `AdminSetUserMFAPreference`
- `AdminUserGlobalSignOut`
- `AdminInitiateAuth`
- `AdminRespondToAuthChallenge`
- `AdminAddUserToGroup`
- `AdminRemoveUserFromGroup`
- `AdminListGroupsForUser`
- `AdminGetDevice`
- `AdminListDevices`
- `AdminForgetDevice`
- `AdminUpdateDeviceStatus`
- `AdminDisableProviderForUser`
- `AdminLinkProviderForUser`
- `AdminListUserAuthEvents`
- `AdminUpdateAuthEventFeedback`
- `ListUsers` (for the user list view)

## User Stories

- As an admin, I want to browse all users in a user pool with search and filtering.
- As an admin, I want to create users with custom attributes.
- As an admin, I want to view full user details including attributes, groups, devices, and auth events.
- As an admin, I want to perform user actions: enable, disable, reset password, force sign-out, confirm sign-up.
- As an admin, I want to manage a user's group membership.
- As an admin, I want to manage a user's MFA preferences.
- As an admin, I want to manage a user's devices.
- As an admin, I want to manage linked identity providers for a user.
- As an admin, I want to view and provide feedback on auth events.

## Acceptance Criteria

### User List
- [ ] Cloudscape `Table` with columns: Username, Email, Phone, Status, Enabled, Created, Last Modified
- [ ] `PropertyFilter` supporting filter by status, enabled state, email, phone
- [ ] `Pagination` using `NextToken`-based infinite loading
- [ ] Bulk actions: enable, disable, delete (with multi-select)
- [ ] Create user button in header

### Create User
- [ ] Cloudscape `Form` with fields:
  - Username (required)
  - Temporary password (optional, auto-generate toggle)
  - Email, phone, name (based on pool's required attributes)
  - Custom attributes (dynamic fields based on pool schema)
  - Send invitation (email/SMS toggle)
  - Suppress welcome message option
- [ ] Validation against user pool's attribute schema

### User Detail Page
- [ ] Tabbed layout using Cloudscape `Tabs`:
  - **Overview**: username, status, enabled, email verified, phone verified, created, last modified, sub
  - **Attributes**: key-value table with edit/delete capability, add custom attribute
  - **Groups**: table of group memberships with add/remove actions
  - **Devices**: table of devices with forget/update status actions
  - **Security**: MFA preferences, auth events table with feedback actions
  - **Linked providers**: table of linked IdPs with link/unlink actions

### User Actions (detail page header)
- [ ] Action dropdown with: Enable/Disable (toggle), Reset password, Set password, Confirm sign-up, Global sign-out, Delete
- [ ] Each action shows a confirmation modal with appropriate inputs
- [ ] Set password modal: new password input with strength indicator
- [ ] Delete user modal: type username to confirm

### Auth Events Tab
- [ ] Table showing: Event ID, Event Type, Creation Date, Event Risk, Event Response, IP Address
- [ ] Provide feedback action (valid/invalid) via `AdminUpdateAuthEventFeedback`
- [ ] Pagination for auth events

### Testing
- [ ] Unit tests: user table rendering, filtering, pagination
- [ ] Unit tests: create form validation
- [ ] Unit tests: detail page tabs render correctly
- [ ] Unit tests: action modals display and submit correctly
- [ ] Integration tests: create → view → edit attributes → delete flow
- [ ] Integration tests: group membership add/remove
- [ ] Integration tests: device management
- [ ] E2E test: full user lifecycle (create, view, edit, manage groups, delete)

## Technical Constraints

- User detail route: `/user-pools/:userPoolId/users/:username`
- User list must handle pools with thousands of users (virtual scrolling or pagination, never load all)
- Attribute editor must dynamically render fields based on user pool schema
- Custom attributes prefixed with `custom:` must be editable
- Standard attributes must respect mutability settings from the user pool schema
