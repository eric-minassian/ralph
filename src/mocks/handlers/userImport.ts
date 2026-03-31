import type { OperationResolver } from './cognitoHandler'
import { importJobStore } from '../stores/importJobStore'

const DEFAULT_MAX_RESULTS = 20

function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key]
  return typeof val === 'string' ? val : undefined
}

function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const val = obj[key]
  return typeof val === 'number' ? val : undefined
}

const CreateUserImportJob: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const job = importJobStore.create(userPoolId, body)
  return { UserImportJob: job }
}

const DescribeUserImportJob: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const jobId = getString(body, 'JobId') ?? ''
  const job = importJobStore.describe(userPoolId, jobId)
  return { UserImportJob: job }
}

const StartUserImportJob: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const jobId = getString(body, 'JobId') ?? ''
  const job = importJobStore.start(userPoolId, jobId)
  return { UserImportJob: job }
}

const StopUserImportJob: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const jobId = getString(body, 'JobId') ?? ''
  const job = importJobStore.stop(userPoolId, jobId)
  return { UserImportJob: job }
}

const ListUserImportJobs: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const maxResults = getNumber(body, 'MaxResults') ?? DEFAULT_MAX_RESULTS
  const paginationToken = getString(body, 'PaginationToken')
  return importJobStore.list(userPoolId, maxResults, paginationToken)
}

const GetCSVHeader: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  return importJobStore.getCSVHeader(userPoolId)
}

export const userImportOperations: Record<string, OperationResolver> = {
  CreateUserImportJob,
  DescribeUserImportJob,
  StartUserImportJob,
  StopUserImportJob,
  ListUserImportJobs,
  GetCSVHeader,
}
