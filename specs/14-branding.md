# Spec: Branding

## Overview

UI for managing the visual appearance of the Cognito hosted UI / managed login pages, including both the legacy UI customization and the new managed login branding.

## APIs Covered

- `CreateManagedLoginBranding`
- `DescribeManagedLoginBranding`
- `DescribeManagedLoginBrandingByClient`
- `UpdateManagedLoginBranding`
- `DeleteManagedLoginBranding`
- `GetUICustomization`
- `SetUICustomization`

## User Stories

- As an admin, I want to customize the look and feel of our login pages.
- As an admin, I want to upload logos and set brand colors.
- As an admin, I want to preview branding changes.
- As an admin, I want different branding per app client (optional).

## Acceptance Criteria

### Managed Login Branding
- [ ] Scope selector: pool-level or per-client
- [ ] Branding settings form:
  - Logo upload (via Cloudscape `FileUpload`)
  - Background color picker
  - Button color picker
  - CSS customization textarea
- [ ] Live preview panel showing how the login page will look
- [ ] Save, reset to defaults, and delete actions
- [ ] Per-client branding: select client from dropdown, then configure

### Legacy UI Customization
- [ ] CSS textarea for custom styles
- [ ] Image upload for logo
- [ ] Scope: pool-level or per-client
- [ ] Note indicating this is legacy, recommend managed login branding

### Testing
- [ ] Unit tests: form rendering, file upload handling
- [ ] Integration tests: CRUD lifecycle for managed branding with MSW
- [ ] Integration tests: legacy UI customization with MSW
- [ ] E2E test: upload logo → set colors → preview → save

## Technical Constraints

- Route: `/user-pools/:userPoolId/branding`
- Image uploads must validate file type (PNG, JPG, SVG) and size limits
- Color inputs should use a proper color picker component
- Preview should render in an iframe or styled container
