# Spec: Resource Tagging

## Overview

UI for managing AWS resource tags on Cognito resources (user pools, etc.).

## APIs Covered

- `ListTagsForResource`
- `TagResource`
- `UntagResource`

## User Stories

- As an admin, I want to view all tags on a resource.
- As an admin, I want to add, edit, and remove tags.

## Acceptance Criteria

- [ ] Cloudscape `TagEditor` component used for tag management
- [ ] Tags section on user pool detail page
- [ ] Display existing tags in key-value table
- [ ] Add tag: key (required, max 128 chars) + value (optional, max 256 chars)
- [ ] Remove tag with confirmation
- [ ] Bulk tag editing (add/remove multiple tags, save all at once)
- [ ] Validation: tag key uniqueness, character limits, reserved prefix `aws:` not allowed
- [ ] Unit tests: tag editor rendering and validation
- [ ] Integration tests: list, add, remove tags with MSW

## Technical Constraints

- Tags section is embedded in resource detail pages, not a standalone route
- Tag operations require the resource ARN
- Maximum 50 tags per resource (AWS limit) — validate before submit
- Cloudscape provides a `TagEditor` component — use it
