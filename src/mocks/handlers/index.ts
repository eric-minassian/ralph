import type { HttpHandler } from 'msw'
import { createCognitoHandler } from './cognitoHandler'
import type { OperationResolver } from './cognitoHandler'
import { userPoolOperations } from './userPools'

const allOperations: Record<string, OperationResolver> = {
  ...userPoolOperations,
}

export const handlers: HttpHandler[] = [createCognitoHandler(allOperations)]
