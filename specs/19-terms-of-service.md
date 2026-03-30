# Spec: Terms of Service Management

## Overview

CRUD UI for managing terms of service that users must accept during sign-up or sign-in.

## APIs Covered

- `CreateTerms`
- `DescribeTerms`
- `UpdateTerms`
- `DeleteTerms`
- `ListTerms`

## User Stories

- As an admin, I want to create terms of service with versioned content.
- As an admin, I want to view, edit, and delete terms.
- As an admin, I want to see which terms are active.

## Acceptance Criteria

### Terms List
- [ ] Cloudscape `Table` with columns: Terms ID, Version, Status, Created, Last Modified
- [ ] `TextFilter` for searching
- [ ] Create button in header

### Create/Edit Terms
- [ ] Form fields: Version label, Terms text (rich text or markdown input), Status (draft/active)
- [ ] Cloudscape `Textarea` or `CodeEditor` for terms content
- [ ] Validation: version required, text required

### Terms Detail
- [ ] Full terms content displayed
- [ ] Metadata: ID, version, status, dates
- [ ] Edit and delete actions
- [ ] Delete with confirmation

### Testing
- [ ] Unit tests: form, table, detail page
- [ ] Integration tests: CRUD lifecycle with MSW
- [ ] E2E test: create terms → edit → activate → delete

## Technical Constraints

- Route: `/user-pools/:userPoolId/terms/:termsId`
- Terms content may be long — use expandable section or dedicated view
- Only one version can be active at a time (if applicable — verify with API behavior)
