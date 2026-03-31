import type { UserImportJobType } from '@aws-sdk/client-cognito-identity-provider'

let counter = 0

function nextName(): string {
  counter += 1
  return `ImportJob${String(counter).padStart(3, '0')}`
}

function nextJobId(): string {
  counter += 1
  return `import-${String(counter).padStart(6, '0')}`
}

/**
 * Creates a realistic mock UserImportJobType.
 */
export function createMockUserImportJob(
  userPoolId: string,
  overrides: Partial<UserImportJobType> = {},
): UserImportJobType {
  const jobName = overrides.JobName ?? nextName()
  const jobId = overrides.JobId ?? nextJobId()
  const now = new Date()
  return {
    UserPoolId: userPoolId,
    JobId: jobId,
    JobName: jobName,
    Status: 'Created',
    PreSignedUrl: `https://cognito-idp-user-import.s3.amazonaws.com/${userPoolId}/${jobId}.csv?X-Amz-Security-Token=mock`,
    CreationDate: now,
    CloudWatchLogsRoleArn: `arn:aws:iam::123456789012:role/CognitoCloudWatchLogsRole`,
    ImportedUsers: 0,
    SkippedUsers: 0,
    FailedUsers: 0,
    ...overrides,
  }
}

/**
 * Resets the counter — call in test teardown if needed.
 */
export function resetUserImportJobCounter(): void {
  counter = 0
}
