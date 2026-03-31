import type { OperationResolver } from './cognitoHandler'
import { resourceServerStore } from '../stores/resourceServerStore'

const DEFAULT_MAX_RESULTS = 20

function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key]
  return typeof val === 'string' ? val : undefined
}

function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const val = obj[key]
  return typeof val === 'number' ? val : undefined
}

const CreateResourceServer: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const resourceServer = resourceServerStore.create(userPoolId, body)
  return { ResourceServer: resourceServer }
}

const DescribeResourceServer: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const identifier = getString(body, 'Identifier') ?? ''
  const resourceServer = resourceServerStore.describe(userPoolId, identifier)
  return { ResourceServer: resourceServer }
}

const UpdateResourceServer: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const resourceServer = resourceServerStore.update(userPoolId, body)
  return { ResourceServer: resourceServer }
}

const DeleteResourceServer: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const identifier = getString(body, 'Identifier') ?? ''
  resourceServerStore.delete(userPoolId, identifier)
  return {}
}

const ListResourceServers: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const maxResults = getNumber(body, 'MaxResults') ?? DEFAULT_MAX_RESULTS
  const nextToken = getString(body, 'NextToken')
  return resourceServerStore.list(userPoolId, maxResults, nextToken)
}

export const resourceServerOperations: Record<string, OperationResolver> = {
  CreateResourceServer,
  DescribeResourceServer,
  UpdateResourceServer,
  DeleteResourceServer,
  ListResourceServers,
}
