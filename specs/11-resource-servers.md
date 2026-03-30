# Spec: Resource Server Management

## Overview

CRUD UI for OAuth 2.0 resource servers and their custom scopes within a user pool.

## APIs Covered

- `CreateResourceServer`
- `DescribeResourceServer`
- `UpdateResourceServer`
- `DeleteResourceServer`
- `ListResourceServers`

## User Stories

- As an admin, I want to define resource servers to represent APIs protected by this user pool.
- As an admin, I want to define custom OAuth scopes on resource servers.
- As an admin, I want to edit and delete resource servers.

## Acceptance Criteria

### Resource Server List
- [ ] Cloudscape `Table` with columns: Name, Identifier, Number of Scopes
- [ ] `TextFilter` for searching
- [ ] Create button in header

### Create/Edit Resource Server
- [ ] Form fields: Name (required), Identifier (required, immutable on edit)
- [ ] Scopes editor: Cloudscape `AttributeEditor` for adding/removing scopes
  - Each scope: Name (required) + Description (required)
- [ ] Validation: identifier must be a valid URI or short identifier, scope names unique

### Resource Server Detail
- [ ] Identifier, name displayed
- [ ] Scopes table with name and description
- [ ] Edit and delete actions

### Testing
- [ ] Unit tests: form, attribute editor, table
- [ ] Integration tests: CRUD lifecycle with MSW
- [ ] E2E test: create → add scopes → edit → delete

## Technical Constraints

- Route: `/user-pools/:userPoolId/resource-servers/:identifier`
- Identifier is immutable after creation
- Scopes defined here appear in app client OAuth scope configuration
