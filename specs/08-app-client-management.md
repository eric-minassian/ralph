# Spec: App Client Management

## Overview

CRUD UI for Cognito user pool app clients including client secret management.

## APIs Covered

- `CreateUserPoolClient`
- `DescribeUserPoolClient`
- `UpdateUserPoolClient`
- `DeleteUserPoolClient`
- `ListUserPoolClients`
- `AddUserPoolClientSecret`
- `DeleteUserPoolClientSecret`
- `ListUserPoolClientSecrets`

## User Stories

- As an admin, I want to see all app clients for a user pool.
- As an admin, I want to create and configure app clients with auth flows, scopes, and callback URLs.
- As an admin, I want to manage client secrets (create, list, delete).
- As an admin, I want to delete app clients.

## Acceptance Criteria

### App Client List
- [ ] Cloudscape `Table` with columns: Client Name, Client ID, Created, Last Modified
- [ ] `TextFilter` for searching
- [ ] `Pagination`
- [ ] Create button in header

### Create/Edit App Client
- [ ] Cloudscape `Form` (or multi-section form) with:
  - Client name (required)
  - Generate client secret toggle
  - Auth flows checkboxes (ALLOW_USER_PASSWORD_AUTH, ALLOW_USER_SRP_AUTH, ALLOW_REFRESH_TOKEN_AUTH, ALLOW_CUSTOM_AUTH, ALLOW_ADMIN_USER_PASSWORD_AUTH)
  - OAuth settings: allowed OAuth flows, scopes, callback URLs, logout URLs, allowed OAuth scopes
  - Token validity: access token, ID token, refresh token (with unit selectors)
  - Read/write attributes: multi-select from pool schema
  - Prevent user existence errors toggle
  - Enable token revocation toggle
- [ ] Validation for callback URL format, token validity ranges

### App Client Detail Page
- [ ] All configuration displayed in organized `Container` sections
- [ ] Client ID displayed with copy-to-clipboard
- [ ] Client secret section:
  - Table of secrets (ID, creation date)
  - Create new secret button
  - Delete secret with confirmation
  - Secret value shown once on creation (with copy button and warning)
- [ ] Edit and delete actions in header

### Testing
- [ ] Unit tests: form validation, table rendering
- [ ] Integration tests: CRUD lifecycle with MSW
- [ ] Integration tests: secret management
- [ ] E2E test: create client → configure → manage secrets → delete

## Technical Constraints

- Route: `/user-pools/:userPoolId/app-clients/:clientId`
- Client secret values must only be displayed once (on creation) and never persisted in state
- OAuth configuration must validate callback URLs as valid URIs
- Auth flow checkboxes must reflect allowed combinations
