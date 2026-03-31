import type { HttpHandler } from 'msw'
import { createCognitoHandler } from './cognitoHandler'
import type { OperationResolver } from './cognitoHandler'
import { userPoolOperations } from './userPools'
import { userOperations } from './users'

const allOperations: Record<string, OperationResolver> = {
  ...userPoolOperations,
  ...userOperations,
}

export const handlers: HttpHandler[] = [createCognitoHandler(allOperations)]
