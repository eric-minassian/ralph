import type { OperationResolver } from './cognitoHandler'
import { userPoolStore } from '../stores/userPoolStore'

const DEFAULT_MAX_RESULTS = 20

function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key]
  return typeof val === 'string' ? val : undefined
}

function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const val = obj[key]
  return typeof val === 'number' ? val : undefined
}

const ListUserPools: OperationResolver = (body) => {
  const maxResults = getNumber(body, 'MaxResults') ?? DEFAULT_MAX_RESULTS
  const nextToken = getString(body, 'NextToken')
  return userPoolStore.list(maxResults, nextToken)
}

const DescribeUserPool: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  return { UserPool: userPoolStore.describe(userPoolId) }
}

const CreateUserPool: OperationResolver = (body) => {
  const pool = userPoolStore.create(body)
  return { UserPool: pool }
}

const UpdateUserPool: OperationResolver = (body) => {
  userPoolStore.update(body)
  return {}
}

const DeleteUserPool: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  userPoolStore.delete(userPoolId)
  return {}
}

const AddCustomAttributes: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  userPoolStore.addCustomAttributes(userPoolId, body.CustomAttributes)
  return {}
}

const GetUserPoolMfaConfig: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  return userPoolStore.getMfaConfig(userPoolId)
}

const SetUserPoolMfaConfig: OperationResolver = (body) => {
  return userPoolStore.setMfaConfig(body)
}

export const userPoolOperations: Record<string, OperationResolver> = {
  ListUserPools,
  DescribeUserPool,
  CreateUserPool,
  UpdateUserPool,
  DeleteUserPool,
  AddCustomAttributes,
  GetUserPoolMfaConfig,
  SetUserPoolMfaConfig,
}
