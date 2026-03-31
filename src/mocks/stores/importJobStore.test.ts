import { describe, it, expect, beforeEach } from 'vitest'
import { importJobStore } from './importJobStore'

const POOL_ID = 'us-east-1_TestPool'

describe('ImportJobStore', () => {
  beforeEach(() => {
    importJobStore.clear()
  })

  describe('create', () => {
    it('creates an import job with name and role ARN', () => {
      const job = importJobStore.create(POOL_ID, {
        JobName: 'Test Import',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/TestRole',
      })
      expect(job.JobName).toBe('Test Import')
      expect(job.CloudWatchLogsRoleArn).toBe('arn:aws:iam::123456789012:role/TestRole')
      expect(job.UserPoolId).toBe(POOL_ID)
      expect(job.Status).toBe('Created')
      expect(job.JobId).toBeDefined()
      expect(job.PreSignedUrl).toBeDefined()
      expect(job.CreationDate).toBeInstanceOf(Date)
      expect(job.ImportedUsers).toBe(0)
      expect(job.SkippedUsers).toBe(0)
      expect(job.FailedUsers).toBe(0)
    })

    it('throws on missing job name', () => {
      expect(() =>
        importJobStore.create(POOL_ID, {
          CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/TestRole',
        }),
      ).toThrow('JobName is required')
    })

    it('throws on empty job name', () => {
      expect(() =>
        importJobStore.create(POOL_ID, {
          JobName: '   ',
          CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/TestRole',
        }),
      ).toThrow('JobName is required')
    })

    it('throws on missing role ARN', () => {
      expect(() =>
        importJobStore.create(POOL_ID, { JobName: 'Test' }),
      ).toThrow('CloudWatchLogsRoleArn is required')
    })

    it('assigns unique job IDs', () => {
      const job1 = importJobStore.create(POOL_ID, {
        JobName: 'Job 1',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
      const job2 = importJobStore.create(POOL_ID, {
        JobName: 'Job 2',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
      expect(job1.JobId).not.toBe(job2.JobId)
    })
  })

  describe('describe', () => {
    it('returns a created import job', () => {
      const created = importJobStore.create(POOL_ID, {
        JobName: 'Test Import',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/TestRole',
      })
      const job = importJobStore.describe(POOL_ID, created.JobId ?? '')
      expect(job.JobName).toBe('Test Import')
    })

    it('throws when not found', () => {
      expect(() => importJobStore.describe(POOL_ID, 'nonexistent')).toThrow()
    })
  })

  describe('start', () => {
    it('starts a Created job', () => {
      const created = importJobStore.create(POOL_ID, {
        JobName: 'Test',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
      const started = importJobStore.start(POOL_ID, created.JobId ?? '')
      expect(started.Status).toBe('Pending')
      expect(started.StartDate).toBeInstanceOf(Date)
    })

    it('throws when starting a non-Created job', () => {
      const created = importJobStore.create(POOL_ID, {
        JobName: 'Test',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
      importJobStore.start(POOL_ID, created.JobId ?? '')
      expect(() => importJobStore.start(POOL_ID, created.JobId ?? '')).toThrow(
        'Cannot start a job with status Pending',
      )
    })
  })

  describe('stop', () => {
    it('stops a Pending job', () => {
      const created = importJobStore.create(POOL_ID, {
        JobName: 'Test',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
      importJobStore.start(POOL_ID, created.JobId ?? '')
      const stopped = importJobStore.stop(POOL_ID, created.JobId ?? '')
      expect(stopped.Status).toBe('Stopping')
    })

    it('throws when stopping a Created job', () => {
      const created = importJobStore.create(POOL_ID, {
        JobName: 'Test',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
      expect(() => importJobStore.stop(POOL_ID, created.JobId ?? '')).toThrow(
        'Cannot stop a job with status Created',
      )
    })
  })

  describe('advanceJob', () => {
    it('advances Pending to InProgress', () => {
      const created = importJobStore.create(POOL_ID, {
        JobName: 'Test',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
      importJobStore.start(POOL_ID, created.JobId ?? '')
      const advanced = importJobStore.advanceJob(POOL_ID, created.JobId ?? '')
      expect(advanced.Status).toBe('InProgress')
      expect(advanced.ImportedUsers).toBeGreaterThan(0)
    })

    it('advances InProgress to Succeeded', () => {
      const created = importJobStore.create(POOL_ID, {
        JobName: 'Test',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
      importJobStore.start(POOL_ID, created.JobId ?? '')
      importJobStore.advanceJob(POOL_ID, created.JobId ?? '') // Pending → InProgress
      const completed = importJobStore.advanceJob(POOL_ID, created.JobId ?? '') // InProgress → Succeeded
      expect(completed.Status).toBe('Succeeded')
      expect(completed.CompletionDate).toBeInstanceOf(Date)
      expect(completed.CompletionMessage).toBeDefined()
    })

    it('advances Stopping to Stopped', () => {
      const created = importJobStore.create(POOL_ID, {
        JobName: 'Test',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
      importJobStore.start(POOL_ID, created.JobId ?? '')
      importJobStore.stop(POOL_ID, created.JobId ?? '')
      const stopped = importJobStore.advanceJob(POOL_ID, created.JobId ?? '')
      expect(stopped.Status).toBe('Stopped')
      expect(stopped.CompletionDate).toBeInstanceOf(Date)
    })
  })

  describe('list', () => {
    it('returns empty list', () => {
      const result = importJobStore.list(POOL_ID, 10)
      expect(result.UserImportJobs).toEqual([])
      expect(result.PaginationToken).toBeUndefined()
    })

    it('returns jobs for the pool only', () => {
      importJobStore.create(POOL_ID, {
        JobName: 'Job A',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
      importJobStore.create(POOL_ID, {
        JobName: 'Job B',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
      importJobStore.create('other-pool', {
        JobName: 'Job C',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })

      const result = importJobStore.list(POOL_ID, 10)
      expect(result.UserImportJobs).toHaveLength(2)
    })

    it('paginates results', () => {
      for (let i = 0; i < 5; i++) {
        importJobStore.create(POOL_ID, {
          JobName: `Job ${String(i)}`,
          CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
        })
      }
      const page1 = importJobStore.list(POOL_ID, 2)
      expect(page1.UserImportJobs).toHaveLength(2)
      expect(page1.PaginationToken).toBe('2')

      const page2 = importJobStore.list(POOL_ID, 2, page1.PaginationToken)
      expect(page2.UserImportJobs).toHaveLength(2)
      expect(page2.PaginationToken).toBe('4')

      const page3 = importJobStore.list(POOL_ID, 2, page2.PaginationToken)
      expect(page3.UserImportJobs).toHaveLength(1)
      expect(page3.PaginationToken).toBeUndefined()
    })
  })

  describe('getCSVHeader', () => {
    it('returns CSV headers', () => {
      const result = importJobStore.getCSVHeader(POOL_ID)
      expect(result.UserPoolId).toBe(POOL_ID)
      expect(result.CSVHeader).toContain('cognito:username')
      expect(result.CSVHeader).toContain('email')
      expect(result.CSVHeader.length).toBeGreaterThan(0)
    })
  })

  describe('seed', () => {
    it('seeds demo data', () => {
      importJobStore.seed(POOL_ID)
      const result = importJobStore.list(POOL_ID, 10)
      expect(result.UserImportJobs.length).toBeGreaterThanOrEqual(3)
    })

    it('seeds jobs with different statuses', () => {
      importJobStore.seed(POOL_ID)
      const result = importJobStore.list(POOL_ID, 10)
      const statuses = result.UserImportJobs.map((j) => j.Status)
      expect(statuses).toContain('Succeeded')
      expect(statuses).toContain('InProgress')
      expect(statuses).toContain('Created')
    })
  })
})
