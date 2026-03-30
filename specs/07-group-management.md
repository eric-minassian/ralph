# Spec: Group Management

## Overview

CRUD UI for Cognito user pool groups including group membership management.

## APIs Covered

- `CreateGroup`
- `GetGroup`
- `UpdateGroup`
- `DeleteGroup`
- `ListGroups`
- `ListUsersInGroup`

## User Stories

- As an admin, I want to see all groups in a user pool.
- As an admin, I want to create, edit, and delete groups.
- As an admin, I want to see which users belong to a group and manage membership.

## Acceptance Criteria

### Group List
- [ ] Cloudscape `Table` with columns: Group Name, Description, Precedence, Role ARN, Created, Last Modified
- [ ] `TextFilter` for searching by name
- [ ] `Pagination` for large lists
- [ ] Create group button in header
- [ ] Row click navigates to group detail page

### Create/Edit Group
- [ ] Cloudscape `Form` with fields: Group Name (required, immutable on edit), Description, Role ARN, Precedence
- [ ] Validation: name required, precedence must be non-negative integer
- [ ] Success notification on save

### Group Detail Page
- [ ] Header with group name, description, edit and delete actions
- [ ] `Container` showing: Group Name, Description, Role ARN, Precedence, Created, Last Modified
- [ ] Members section: Cloudscape `Table` of users in the group
  - Columns: Username, Email, Status, Enabled
  - Add user action (modal with user search/select)
  - Remove user action (with confirmation)
  - Pagination for large groups

### Delete Group
- [ ] Cloudscape `Modal` confirmation, type group name to confirm
- [ ] Success notification and redirect to group list

### Testing
- [ ] Unit tests: group table, create/edit forms, detail page
- [ ] Integration tests: CRUD lifecycle with MSW
- [ ] Integration tests: membership management
- [ ] E2E test: create group → add users → remove user → delete group

## Technical Constraints

- Route: `/user-pools/:userPoolId/groups/:groupName`
- Group name is immutable after creation
- Membership management uses `AdminAddUserToGroup` / `AdminRemoveUserFromGroup` (from user management APIs)
