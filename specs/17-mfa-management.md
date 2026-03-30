# Spec: MFA Management

## Overview

UI for managing MFA settings at the user pool level and per-user MFA preferences, including software token (TOTP) configuration.

## APIs Covered

- `GetUserPoolMfaConfig`
- `SetUserPoolMfaConfig`
- `AdminSetUserMFAPreference`
- `AssociateSoftwareToken`
- `VerifySoftwareToken`

## User Stories

- As an admin, I want to configure pool-level MFA settings (OFF, OPTIONAL, REQUIRED).
- As an admin, I want to set which MFA methods are enabled (SMS, TOTP).
- As an admin, I want to manage per-user MFA preferences.

## Acceptance Criteria

### Pool-Level MFA Config (in User Pool detail)
- [ ] MFA mode selector: OFF, OPTIONAL, REQUIRED
- [ ] SMS MFA toggle and configuration
- [ ] Software token (TOTP) MFA toggle
- [ ] Save action with confirmation for mode changes

### Per-User MFA (in User detail)
- [ ] Current MFA preferences display: SMS enabled/preferred, TOTP enabled/preferred
- [ ] Edit MFA preferences: toggle SMS, toggle TOTP, set preferred method
- [ ] Informational: TOTP association is user-initiated (admin can set preferences but not register tokens)

### Testing
- [ ] Unit tests: pool-level config form
- [ ] Unit tests: per-user preference editor
- [ ] Integration tests: get/set pool MFA config, set user preferences with MSW

## Technical Constraints

- Pool-level MFA is part of the user pool detail page (spec 05)
- Per-user MFA is part of the user detail page (spec 06, Security tab)
- Changing MFA from REQUIRED to OFF affects all users — confirmation modal must warn
