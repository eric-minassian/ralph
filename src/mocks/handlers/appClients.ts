import type { OperationResolver } from './cognitoHandler'
import { appClientStore } from '../stores/appClientStore'

const DEFAULT_MAX_RESULTS = 20

function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key]
  return typeof val === 'string' ? val : undefined
}

function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const val = obj[key]
  return typeof val === 'number' ? val : undefined
}

const CreateUserPoolClient: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const client = appClientStore.create(userPoolId, body)
  return { UserPoolClient: client }
}

const DescribeUserPoolClient: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const clientId = getString(body, 'ClientId') ?? ''
  const client = appClientStore.describe(userPoolId, clientId)
  return { UserPoolClient: client }
}

const UpdateUserPoolClient: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const clientId = getString(body, 'ClientId') ?? ''
  const client = appClientStore.update(userPoolId, clientId, body)
  return { UserPoolClient: client }
}

const DeleteUserPoolClient: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const clientId = getString(body, 'ClientId') ?? ''
  appClientStore.delete(userPoolId, clientId)
  return {}
}

const ListUserPoolClients: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const maxResults = getNumber(body, 'MaxResults') ?? DEFAULT_MAX_RESULTS
  const nextToken = getString(body, 'NextToken')
  return appClientStore.list(userPoolId, maxResults, nextToken)
}

const AddUserPoolClientSecret: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const clientId = getString(body, 'ClientId') ?? ''
  const secret = appClientStore.addSecret(userPoolId, clientId)
  return {
    ClientSecretDescriptor: {
      ClientSecretId: secret.ClientSecretId,
      ClientSecretValue: secret.ClientSecretValue,
      ClientSecretCreateDate: secret.ClientSecretCreateDate,
    },
  }
}

const DeleteUserPoolClientSecret: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const clientId = getString(body, 'ClientId') ?? ''
  const secretId = getString(body, 'ClientSecretId') ?? ''
  appClientStore.deleteSecret(userPoolId, clientId, secretId)
  return {}
}

const ListUserPoolClientSecrets: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const clientId = getString(body, 'ClientId') ?? ''
  return appClientStore.listSecrets(userPoolId, clientId)
}

export const appClientOperations: Record<string, OperationResolver> = {
  CreateUserPoolClient,
  DescribeUserPoolClient,
  UpdateUserPoolClient,
  DeleteUserPoolClient,
  ListUserPoolClients,
  AddUserPoolClientSecret,
  DeleteUserPoolClientSecret,
  ListUserPoolClientSecrets,
}
