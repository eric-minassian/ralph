import type { HttpHandler } from 'msw'
import { createCognitoHandler } from './cognitoHandler'
import type { OperationResolver } from './cognitoHandler'
import { userPoolOperations } from './userPools'
import { userOperations } from './users'
import { groupOperations } from './groups'
import { appClientOperations } from './appClients'
import { identityProviderOperations } from './identityProviders'
import { domainOperations } from './domains'

const allOperations: Record<string, OperationResolver> = {
  ...userPoolOperations,
  ...userOperations,
  ...groupOperations,
  ...appClientOperations,
  ...identityProviderOperations,
  ...domainOperations,
}

export const handlers: HttpHandler[] = [createCognitoHandler(allOperations)]
