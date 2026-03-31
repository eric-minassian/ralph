import type { OperationResolver } from './cognitoHandler'
import { identityProviderStore } from '../stores/identityProviderStore'

const DEFAULT_MAX_RESULTS = 20

function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key]
  return typeof val === 'string' ? val : undefined
}

function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const val = obj[key]
  return typeof val === 'number' ? val : undefined
}

const CreateIdentityProvider: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const provider = identityProviderStore.create(userPoolId, body)
  return { IdentityProvider: provider }
}

const DescribeIdentityProvider: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const providerName = getString(body, 'ProviderName') ?? ''
  const provider = identityProviderStore.describe(userPoolId, providerName)
  return { IdentityProvider: provider }
}

const UpdateIdentityProvider: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const providerName = getString(body, 'ProviderName') ?? ''
  const provider = identityProviderStore.update(userPoolId, providerName, body)
  return { IdentityProvider: provider }
}

const DeleteIdentityProvider: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const providerName = getString(body, 'ProviderName') ?? ''
  identityProviderStore.delete(userPoolId, providerName)
  return {}
}

const ListIdentityProviders: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const maxResults = getNumber(body, 'MaxResults') ?? DEFAULT_MAX_RESULTS
  const nextToken = getString(body, 'NextToken')
  return identityProviderStore.list(userPoolId, maxResults, nextToken)
}

const GetIdentityProviderByIdentifier: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const identifier = getString(body, 'IdpIdentifier') ?? ''
  const provider = identityProviderStore.describeByIdentifier(userPoolId, identifier)
  return { IdentityProvider: provider }
}

export const identityProviderOperations: Record<string, OperationResolver> = {
  CreateIdentityProvider,
  DescribeIdentityProvider,
  UpdateIdentityProvider,
  DeleteIdentityProvider,
  ListIdentityProviders,
  GetIdentityProviderByIdentifier,
}
