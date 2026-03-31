import type { HttpHandler } from 'msw'
import { createCognitoHandler } from './cognitoHandler'
import type { OperationResolver } from './cognitoHandler'
import { userPoolOperations } from './userPools'
import { userOperations } from './users'
import { groupOperations } from './groups'

const allOperations: Record<string, OperationResolver> = {
  ...userPoolOperations,
  ...userOperations,
  ...groupOperations,
}

export const handlers: HttpHandler[] = [createCognitoHandler(allOperations)]
