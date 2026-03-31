import type { OperationResolver } from './cognitoHandler'
import { groupStore } from '../stores/groupStore'

const DEFAULT_MAX_RESULTS = 20

function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key]
  return typeof val === 'string' ? val : undefined
}

function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const val = obj[key]
  return typeof val === 'number' ? val : undefined
}

const CreateGroup: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const group = groupStore.create(userPoolId, body)
  return { Group: group }
}

const GetGroup: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const groupName = getString(body, 'GroupName') ?? ''
  const group = groupStore.describe(userPoolId, groupName)
  return { Group: group }
}

const UpdateGroup: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const group = groupStore.update(userPoolId, body)
  return { Group: group }
}

const DeleteGroup: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const groupName = getString(body, 'GroupName') ?? ''
  groupStore.delete(userPoolId, groupName)
  return {}
}

const ListGroups: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const maxResults = getNumber(body, 'Limit') ?? DEFAULT_MAX_RESULTS
  const nextToken = getString(body, 'NextToken')
  return groupStore.list(userPoolId, maxResults, nextToken)
}

const ListUsersInGroup: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const groupName = getString(body, 'GroupName') ?? ''
  const maxResults = getNumber(body, 'Limit') ?? DEFAULT_MAX_RESULTS
  const nextToken = getString(body, 'NextToken')
  return groupStore.listUsersInGroup(userPoolId, groupName, maxResults, nextToken)
}

export const groupOperations: Record<string, OperationResolver> = {
  CreateGroup,
  GetGroup,
  UpdateGroup,
  DeleteGroup,
  ListGroups,
  ListUsersInGroup,
}
