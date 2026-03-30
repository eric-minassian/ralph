# Spec: Advanced Security

## Overview

UI for managing advanced security features: risk configuration, user auth event monitoring, and event feedback.

## APIs Covered

- `DescribeRiskConfiguration`
- `SetRiskConfiguration`
- `UpdateAuthEventFeedback`
- `AdminListUserAuthEvents`
- `AdminUpdateAuthEventFeedback`

## User Stories

- As an admin, I want to configure risk-based adaptive authentication.
- As an admin, I want to set up compromised credentials detection.
- As an admin, I want to view auth events and provide feedback on suspicious activity.

## Acceptance Criteria

### Risk Configuration
- [ ] `Container` sections for:
  - **Compromised credentials**: risk actions for event types (sign-in, sign-up, forgot-password)
  - **Account takeover protection**: risk actions per risk level (low, medium, high), notification settings
  - **IP exceptions**: always-allow and always-block CIDR lists
- [ ] Each section editable with save/cancel
- [ ] Scoped to user pool or per-client (client ID selector)
- [ ] CIDR validation for IP exception lists

### Auth Events
- [ ] Cloudscape `Table` with columns: Event ID, User, Event Type, Risk Decision, Risk Level, IP Address, City, Country, Device, Date
- [ ] `PropertyFilter` for filtering by risk level, event type, date range
- [ ] Feedback action per event: mark as valid or invalid
- [ ] Detail modal showing full event data

### Testing
- [ ] Unit tests: risk configuration forms and validation
- [ ] Unit tests: auth events table rendering and filtering
- [ ] Integration tests: set risk config, list events, provide feedback with MSW
- [ ] E2E test: configure risk settings → view events → provide feedback

## Technical Constraints

- Route: `/user-pools/:userPoolId/security`
- Risk configuration can be pool-level or client-level — provide a selector
- Auth events paginate with `NextToken` — use infinite query
- CIDR inputs must validate IPv4 and IPv6 CIDR notation
