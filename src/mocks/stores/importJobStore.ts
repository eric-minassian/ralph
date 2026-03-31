import type { UserImportJobType, UserImportJobStatusType } from '@aws-sdk/client-cognito-identity-provider'
import { BaseStore, StoreError } from './baseStore'
import { createMockUserImportJob } from '../factories/userImportJob'

// ── Type guard helpers ───────────────────────────────────────────────

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

// ── Store helpers ────────────────────────────────────────────────────

function compositeKey(userPoolId: string, jobId: string): string {
  return `${userPoolId}#${jobId}`
}

function getJobKey(job: UserImportJobType): string {
  return compositeKey(job.UserPoolId ?? '', job.JobId ?? '')
}

let jobIdCounter = 0

function nextJobId(): string {
  jobIdCounter += 1
  return `import-${String(jobIdCounter).padStart(6, '0')}`
}

const VALID_STATUSES: readonly string[] = [
  'Created', 'Pending', 'InProgress', 'Stopping', 'Stopped', 'Succeeded', 'Failed', 'Expired',
]

function isValidStatus(value: unknown): value is UserImportJobStatusType {
  return isString(value) && VALID_STATUSES.includes(value)
}

// ── CSV headers (mock) ──────────────────────────────────────────────

const DEFAULT_CSV_HEADERS = [
  'cognito:username',
  'cognito:mfa_enabled',
  'email',
  'email_verified',
  'phone_number',
  'phone_number_verified',
  'given_name',
  'family_name',
  'name',
]

// ── Main store ──────────────────────────────────────────────────────

class ImportJobStore {
  private readonly store = new BaseStore<UserImportJobType>(getJobKey)

  create(userPoolId: string, input: Record<string, unknown>): UserImportJobType {
    const jobName = input.JobName
    if (!isString(jobName) || jobName.trim().length === 0) {
      throw new StoreError('InvalidParameterException', 'JobName is required')
    }
    const cloudWatchLogsRoleArn = input.CloudWatchLogsRoleArn
    if (!isString(cloudWatchLogsRoleArn) || cloudWatchLogsRoleArn.trim().length === 0) {
      throw new StoreError('InvalidParameterException', 'CloudWatchLogsRoleArn is required')
    }

    const jobId = nextJobId()
    const now = new Date()
    const job: UserImportJobType = {
      UserPoolId: userPoolId,
      JobId: jobId,
      JobName: jobName.trim(),
      Status: 'Created',
      PreSignedUrl: `https://cognito-idp-user-import.s3.amazonaws.com/${userPoolId}/${jobId}.csv?X-Amz-Security-Token=mock`,
      CreationDate: now,
      CloudWatchLogsRoleArn: cloudWatchLogsRoleArn.trim(),
      ImportedUsers: 0,
      SkippedUsers: 0,
      FailedUsers: 0,
    }

    this.store.create(job)
    return job
  }

  describe(userPoolId: string, jobId: string): UserImportJobType {
    return this.store.get(compositeKey(userPoolId, jobId))
  }

  start(userPoolId: string, jobId: string): UserImportJobType {
    const key = compositeKey(userPoolId, jobId)
    return this.store.update(key, (existing) => {
      const status = existing.Status
      if (status !== 'Created') {
        throw new StoreError(
          'InvalidParameterException',
          `Cannot start a job with status ${String(status)}. Job must be in Created status.`,
        )
      }
      const updated: UserImportJobType = { ...existing }
      updated.Status = 'Pending'
      updated.StartDate = new Date()
      return updated
    })
  }

  stop(userPoolId: string, jobId: string): UserImportJobType {
    const key = compositeKey(userPoolId, jobId)
    return this.store.update(key, (existing) => {
      const status = existing.Status
      if (status !== 'Pending' && status !== 'InProgress') {
        throw new StoreError(
          'InvalidParameterException',
          `Cannot stop a job with status ${String(status)}. Job must be in Pending or InProgress status.`,
        )
      }
      const updated: UserImportJobType = { ...existing }
      updated.Status = 'Stopping'
      return updated
    })
  }

  /**
   * Simulates async job progress — advances Pending → InProgress, InProgress → Succeeded, Stopping → Stopped.
   * Call this from tests or on a timer to simulate real job behaviour.
   */
  advanceJob(userPoolId: string, jobId: string): UserImportJobType {
    const key = compositeKey(userPoolId, jobId)
    return this.store.update(key, (existing) => {
      const updated: UserImportJobType = { ...existing }
      if (existing.Status === 'Pending') {
        updated.Status = 'InProgress'
        updated.ImportedUsers = 5
        updated.SkippedUsers = 1
        updated.FailedUsers = 0
      } else if (existing.Status === 'InProgress') {
        updated.Status = 'Succeeded'
        updated.CompletionDate = new Date()
        updated.ImportedUsers = 42
        updated.SkippedUsers = 3
        updated.FailedUsers = 1
        updated.CompletionMessage = 'Import completed successfully.'
      } else if (existing.Status === 'Stopping') {
        updated.Status = 'Stopped'
        updated.CompletionDate = new Date()
        updated.CompletionMessage = 'Import job was stopped by user.'
      }
      return updated
    })
  }

  list(
    userPoolId: string,
    maxResults: number,
    paginationToken?: string,
  ): { UserImportJobs: UserImportJobType[]; PaginationToken: string | undefined } {
    const allJobs = this.store
      .list()
      .filter((job) => job.UserPoolId === userPoolId)
      .sort((a, b) => {
        const aTime = a.CreationDate?.getTime() ?? 0
        const bTime = b.CreationDate?.getTime() ?? 0
        return bTime - aTime
      })
    const startIndex = paginationToken ? parseInt(paginationToken, 10) : 0
    const endIndex = startIndex + maxResults
    const pageItems = allJobs.slice(startIndex, endIndex)
    const newToken = endIndex < allJobs.length ? String(endIndex) : undefined
    return { UserImportJobs: pageItems, PaginationToken: newToken }
  }

  getCSVHeader(userPoolId: string): { UserPoolId: string; CSVHeader: string[] } {
    return {
      UserPoolId: userPoolId,
      CSVHeader: [...DEFAULT_CSV_HEADERS],
    }
  }

  /**
   * Set a job's status directly. Useful for test setup.
   */
  setStatus(userPoolId: string, jobId: string, status: UserImportJobStatusType): UserImportJobType {
    const key = compositeKey(userPoolId, jobId)
    if (!isValidStatus(status)) {
      throw new StoreError('InvalidParameterException', `Invalid status: ${String(status)}`)
    }
    return this.store.update(key, (existing) => {
      const updated: UserImportJobType = { ...existing }
      updated.Status = status
      return updated
    })
  }

  clear(): void {
    this.store.clear()
    jobIdCounter = 0
  }

  get size(): number {
    return this.store.size
  }

  seed(userPoolId: string): void {
    // Completed import
    const completed = createMockUserImportJob(userPoolId, {
      JobName: 'Initial User Import',
      Status: 'Succeeded',
      StartDate: new Date(Date.now() - 86400000),
      CompletionDate: new Date(Date.now() - 82800000),
      ImportedUsers: 150,
      SkippedUsers: 5,
      FailedUsers: 2,
      CompletionMessage: 'Import completed successfully.',
    })
    this.store.create(completed)

    // In-progress import
    const inProgress = createMockUserImportJob(userPoolId, {
      JobName: 'Weekly Sync Import',
      Status: 'InProgress',
      StartDate: new Date(Date.now() - 3600000),
      ImportedUsers: 25,
      SkippedUsers: 1,
      FailedUsers: 0,
    })
    this.store.create(inProgress)

    // Created (not started) import
    const created = createMockUserImportJob(userPoolId, {
      JobName: 'Pending Batch Import',
      Status: 'Created',
    })
    this.store.create(created)
  }
}

export const importJobStore = new ImportJobStore()
