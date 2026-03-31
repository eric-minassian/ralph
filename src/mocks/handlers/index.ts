import type { HttpHandler } from 'msw'
import { createCognitoHandler } from './cognitoHandler'
import type { OperationResolver } from './cognitoHandler'
import { userPoolOperations } from './userPools'
import { userOperations } from './users'
import { groupOperations } from './groups'
import { appClientOperations } from './appClients'

const allOperations: Record<string, OperationResolver> = {
  ...userPoolOperations,
  ...userOperations,
  ...groupOperations,
  ...appClientOperations,
}

export const handlers: HttpHandler[] = [createCognitoHandler(allOperations)]
