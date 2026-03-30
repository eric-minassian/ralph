# Spec: Domain Management

## Overview

UI for managing the custom domain or Cognito-hosted domain for a user pool's hosted UI / managed login.

## APIs Covered

- `CreateUserPoolDomain`
- `DescribeUserPoolDomain`
- `UpdateUserPoolDomain`
- `DeleteUserPoolDomain`

## User Stories

- As an admin, I want to configure a domain for my user pool's hosted login page.
- As an admin, I want to choose between a Cognito-hosted prefix domain or a custom domain.
- As an admin, I want to update or remove the domain.

## Acceptance Criteria

- [ ] Domain status display: shows current domain (if any) with status, CloudFront distribution
- [ ] Create domain form:
  - Toggle: Cognito domain prefix vs. Custom domain
  - Cognito prefix: text input + `.auth.{region}.amazoncognito.com` suffix preview
  - Custom domain: full domain input + ACM certificate ARN input
- [ ] Domain info display after creation: full URL, status, CloudFront distribution (if custom)
- [ ] Update domain (change certificate for custom domain)
- [ ] Delete domain with confirmation
- [ ] Link to open the hosted UI in a new tab
- [ ] Unit tests: form rendering, validation
- [ ] Integration tests: create, describe, update, delete with MSW
- [ ] E2E test: create domain → view → delete

## Technical Constraints

- Route: `/user-pools/:userPoolId/domain`
- Only one domain per user pool — show create if none exists, show detail if one exists
- Custom domain requires ACM certificate ARN — validate ARN format
- Domain creation is async — show pending status and auto-refresh
