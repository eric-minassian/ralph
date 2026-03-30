import type { HttpHandler } from 'msw'
import { createCognitoHandler } from './cognitoHandler'
import type { OperationResolver } from './cognitoHandler'

// Each domain handler file exports a Record<string, OperationResolver>.
// Import and merge them here as features are implemented.
// Example:
//   import { userPoolOperations } from './userPools'
//   import { userOperations } from './users'

const allOperations: Record<string, OperationResolver> = {
  // ...userPoolOperations,
  // ...userOperations,
}

export const handlers: HttpHandler[] = [createCognitoHandler(allOperations)]
