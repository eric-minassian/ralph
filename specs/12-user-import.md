# Spec: User Import

## Overview

UI for bulk importing users into a user pool via CSV file upload and import jobs.

## APIs Covered

- `CreateUserImportJob`
- `DescribeUserImportJob`
- `ListUserImportJobs`
- `StartUserImportJob`
- `StopUserImportJob`
- `GetCSVHeader`

## User Stories

- As an admin, I want to download the CSV template for user import.
- As an admin, I want to upload a CSV file and start an import job.
- As an admin, I want to monitor import job progress.
- As an admin, I want to stop a running import job.

## Acceptance Criteria

### Import Jobs List
- [ ] Cloudscape `Table` with columns: Job ID, Job Name, Status, Created, Started, Completed, Users Imported, Users Skipped, Users Failed
- [ ] Status displayed with Cloudscape `StatusIndicator` (pending, in-progress, succeeded, failed, stopped)
- [ ] Create import job button in header
- [ ] Auto-refresh for in-progress jobs (polling via TanStack Query `refetchInterval`)

### Create Import Job
- [ ] Step 1: Job name input
- [ ] Step 2: Download CSV template button (via `GetCSVHeader`)
- [ ] Step 3: CSV file upload via Cloudscape `FileUpload`
- [ ] Step 4: IAM role ARN input (for CloudWatch logs)
- [ ] Step 5: Review and create
- [ ] After creation, option to start immediately

### Import Job Detail
- [ ] Job metadata: ID, name, status, dates, IAM role
- [ ] Progress stats: imported, skipped, failed counts
- [ ] Pre-signed URL for the CSV (if available)
- [ ] Stop button (for in-progress jobs)
- [ ] Status auto-refreshes while in-progress

### Testing
- [ ] Unit tests: table rendering, status indicators
- [ ] Unit tests: create wizard validation
- [ ] Integration tests: create job → start → monitor with MSW
- [ ] E2E test: download template → create job → view status

## Technical Constraints

- Route: `/user-pools/:userPoolId/import/:jobId`
- CSV template download must trigger a file download in the browser
- Import jobs are async — UI must poll for status updates
- File upload is to a pre-signed S3 URL (returned by `CreateUserImportJob`)
