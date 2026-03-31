import { describe, it, expect, beforeEach } from 'vitest'
import {
  CreateUserImportJobCommand,
  DescribeUserImportJobCommand,
  StartUserImportJobCommand,
  StopUserImportJobCommand,
  ListUserImportJobsCommand,
  GetCSVHeaderCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../../api/client'
import { importJobStore } from '../stores/importJobStore'

const POOL_ID = 'us-east-1_TestPool'

describe('User Import MSW handlers', () => {
  beforeEach(() => {
    importJobStore.clear()
  })

  it('creates an import job', async () => {
    const result = await cognitoClient.send(
      new CreateUserImportJobCommand({
        UserPoolId: POOL_ID,
        JobName: 'Test Import',
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/TestRole',
      }),
    )
    expect(result.UserImportJob?.JobName).toBe('Test Import')
    expect(result.UserImportJob?.Status).toBe('Created')
    expect(result.UserImportJob?.JobId).toBeDefined()
    expect(result.UserImportJob?.PreSignedUrl).toBeDefined()
  })

  it('describes an import job', async () => {
    const created = importJobStore.create(POOL_ID, {
      JobName: 'Describe Test',
      CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/TestRole',
    })
    const result = await cognitoClient.send(
      new DescribeUserImportJobCommand({
        UserPoolId: POOL_ID,
        JobId: created.JobId,
      }),
    )
    expect(result.UserImportJob?.JobName).toBe('Describe Test')
  })

  it('starts an import job', async () => {
    const created = importJobStore.create(POOL_ID, {
      JobName: 'Start Test',
      CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/TestRole',
    })
    const result = await cognitoClient.send(
      new StartUserImportJobCommand({
        UserPoolId: POOL_ID,
        JobId: created.JobId ?? '',
      }),
    )
    expect(result.UserImportJob?.Status).toBe('Pending')
  })

  it('stops an import job', async () => {
    const created = importJobStore.create(POOL_ID, {
      JobName: 'Stop Test',
      CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/TestRole',
    })
    importJobStore.start(POOL_ID, created.JobId ?? '')
    const result = await cognitoClient.send(
      new StopUserImportJobCommand({
        UserPoolId: POOL_ID,
        JobId: created.JobId ?? '',
      }),
    )
    expect(result.UserImportJob?.Status).toBe('Stopping')
  })

  it('lists import jobs', async () => {
    importJobStore.create(POOL_ID, {
      JobName: 'Job 1',
      CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
    })
    importJobStore.create(POOL_ID, {
      JobName: 'Job 2',
      CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
    })

    const result = await cognitoClient.send(
      new ListUserImportJobsCommand({
        UserPoolId: POOL_ID,
        MaxResults: 10,
      }),
    )
    expect(result.UserImportJobs).toHaveLength(2)
  })

  it('handles list pagination', async () => {
    for (let i = 0; i < 5; i++) {
      importJobStore.create(POOL_ID, {
        JobName: `Job ${String(i)}`,
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
    }
    const page1 = await cognitoClient.send(
      new ListUserImportJobsCommand({
        UserPoolId: POOL_ID,
        MaxResults: 2,
      }),
    )
    expect(page1.UserImportJobs).toHaveLength(2)
    expect(page1.PaginationToken).toBeDefined()

    const page2 = await cognitoClient.send(
      new ListUserImportJobsCommand({
        UserPoolId: POOL_ID,
        MaxResults: 2,
        PaginationToken: page1.PaginationToken,
      }),
    )
    expect(page2.UserImportJobs).toHaveLength(2)
  })

  it('gets CSV header', async () => {
    const result = await cognitoClient.send(
      new GetCSVHeaderCommand({
        UserPoolId: POOL_ID,
      }),
    )
    expect(result.UserPoolId).toBe(POOL_ID)
    expect(result.CSVHeader).toBeDefined()
    expect(result.CSVHeader?.length).toBeGreaterThan(0)
    expect(result.CSVHeader).toContain('cognito:username')
  })

  it('returns error for describe non-existent job', async () => {
    await expect(
      cognitoClient.send(
        new DescribeUserImportJobCommand({
          UserPoolId: POOL_ID,
          JobId: 'nonexistent',
        }),
      ),
    ).rejects.toThrow()
  })
})
