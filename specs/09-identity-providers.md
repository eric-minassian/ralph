# Spec: Identity Provider Management

## Overview

CRUD UI for managing external identity providers (SAML, OIDC, social) linked to a Cognito user pool.

## APIs Covered

- `CreateIdentityProvider`
- `DescribeIdentityProvider`
- `UpdateIdentityProvider`
- `DeleteIdentityProvider`
- `ListIdentityProviders`
- `GetIdentityProviderByIdentifier`

## User Stories

- As an admin, I want to see all identity providers configured for a user pool.
- As an admin, I want to add SAML, OIDC, and social identity providers.
- As an admin, I want to configure attribute mapping between the IdP and Cognito.
- As an admin, I want to edit and delete identity providers.

## Acceptance Criteria

### IdP List
- [ ] Cloudscape `Table` with columns: Provider Name, Provider Type (SAML/OIDC/Social), Creation Date, Last Modified
- [ ] `TextFilter` for searching
- [ ] Create button with dropdown: SAML, OIDC, Facebook, Google, Amazon, Apple, GitHub

### Create/Edit IdP
- [ ] Dynamic form based on provider type:
  - **SAML**: Metadata URL or file upload, attribute mapping
  - **OIDC**: Client ID, Client Secret, Issuer URL, authorize/token/userinfo/jwks endpoints, scopes, attribute mapping
  - **Social**: Client ID, Client Secret, Scopes (provider-specific)
- [ ] Attribute mapping editor: table with IdP attribute → Cognito attribute pairs, add/remove rows
- [ ] IdP identifiers (optional, for `GetIdentityProviderByIdentifier`)
- [ ] Validation for URLs, required fields per provider type

### IdP Detail Page
- [ ] All configuration displayed in organized sections
- [ ] Attribute mapping table
- [ ] Edit and delete actions
- [ ] Delete with confirmation modal

### Testing
- [ ] Unit tests: dynamic form rendering per provider type
- [ ] Unit tests: attribute mapping editor
- [ ] Integration tests: CRUD for each provider type
- [ ] E2E test: create OIDC provider → configure mapping → delete

## Technical Constraints

- Route: `/user-pools/:userPoolId/identity-providers/:providerName`
- Form must dynamically render different fields based on provider type selection
- SAML metadata file upload must support XML parsing and validation
- Attribute mapping must show available Cognito attributes from the user pool schema
