# Spec: WebAuthn / Passkey Management

## Overview

UI for viewing and managing WebAuthn credentials (passkeys) registered for users.

## APIs Covered

- `StartWebAuthnRegistration`
- `CompleteWebAuthnRegistration`
- `ListWebAuthnCredentials`
- `DeleteWebAuthnCredential`

## User Stories

- As an admin, I want to see all passkeys registered for a user.
- As an admin, I want to delete a passkey for a user.
- As an admin, I want to understand the registration flow (informational).

## Acceptance Criteria

- [ ] WebAuthn credentials table within user detail page (Security tab or dedicated sub-tab)
- [ ] Columns: Credential ID, Friendly Name, Created Date, Last Used
- [ ] Delete credential action with confirmation modal
- [ ] Informational note: registration is initiated client-side by the user, admin can only view/delete
- [ ] Unit tests: table rendering, delete action
- [ ] Integration tests: list and delete with MSW

## Technical Constraints

- `StartWebAuthnRegistration` and `CompleteWebAuthnRegistration` are user-initiated operations — the admin UI only lists and deletes
- Displayed within user detail page, not standalone
