# Spec: User Pool Management

## Overview

Full CRUD UI for Cognito User Pools including MFA configuration and log delivery settings. This is the primary entry point of the application — users select a user pool, then manage resources within it.

## APIs Covered

- `CreateUserPool`
- `DescribeUserPool`
- `UpdateUserPool`
- `DeleteUserPool`
- `ListUserPools`
- `AddCustomAttributes`
- `GetUserPoolMfaConfig`
- `SetUserPoolMfaConfig`
- `GetLogDeliveryConfiguration`
- `SetLogDeliveryConfiguration`

## User Stories

- As an admin, I want to see all my user pools in a searchable, sortable table.
- As an admin, I want to create a new user pool with all configurable options.
- As an admin, I want to view and edit user pool settings.
- As an admin, I want to configure MFA settings for a user pool.
- As an admin, I want to manage custom attributes on a user pool.
- As an admin, I want to configure log delivery for a user pool.
- As an admin, I want to delete a user pool with a confirmation step.

## Acceptance Criteria

### List View
- [ ] Cloudscape `Table` with columns: Name, ID, Status, Creation Date, Last Modified
- [ ] `TextFilter` for searching by name
- [ ] `Pagination` for large lists
- [ ] `CollectionPreferences` for column visibility, page size, wrap lines
- [ ] Empty state with create action when no user pools exist
- [ ] Row click navigates to user pool detail page

### Create View
- [ ] Cloudscape `Wizard` for multi-step creation:
  - Step 1: Pool name, description, deletion protection
  - Step 2: Sign-in options (username, email, phone), attribute requirements
  - Step 3: Password policy, MFA configuration
  - Step 4: Email/SMS delivery configuration
  - Step 5: Review and create
- [ ] Form validation on each step before allowing next
- [ ] Success flash notification and redirect to detail page on creation

### Detail View
- [ ] Cloudscape `Container` sections for:
  - General settings (name, ID, ARN, status, dates)
  - Sign-in configuration
  - Password policy
  - MFA configuration (with edit capability via `SetUserPoolMfaConfig`)
  - Custom attributes (with add capability via `AddCustomAttributes`)
  - Log delivery configuration (with edit via `Set/GetLogDeliveryConfiguration`)
  - Deletion protection
- [ ] Edit button on each section opens inline editing or modal
- [ ] Delete button with Cloudscape `Modal` confirmation (type pool name to confirm)
- [ ] Tabs or sub-navigation for related resources (Users, Groups, App Clients, etc.)

### Testing
- [ ] Unit tests: table renders, filters, paginates correctly
- [ ] Unit tests: wizard validation works on each step
- [ ] Unit tests: detail view sections render all fields
- [ ] Integration tests: create flow end-to-end with MSW
- [ ] Integration tests: edit/delete flows with MSW
- [ ] E2E test: full create → view → edit → delete lifecycle

## Technical Constraints

- Use Cloudscape `Table`, `Wizard`, `Container`, `Modal`, `TextFilter`, `Pagination`, `CollectionPreferences`
- All form fields must have validation with i18n error messages
- User pool ID must be a route parameter: `/user-pools/:userPoolId`
- User pool context (selected pool) should be available to child routes via TanStack Router context
