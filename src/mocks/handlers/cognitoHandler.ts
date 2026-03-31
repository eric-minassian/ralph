/**
 * Helper for creating MSW handlers that intercept AWS SDK Cognito requests.
 *
 * The SDK sends POST requests with:
 * - Header: X-Amz-Target: AWSCognitoIdentityProviderService.{OperationName}
 * - Header: Content-Type: application/x-amz-json-1.1
 * - Body: JSON command parameters
 *
 * This helper creates a single handler that dispatches to operation resolvers
 * based on the X-Amz-Target header.
 */

import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import { StoreError } from '../stores/baseStore'

const COGNITO_TARGET_PREFIX = 'AWSCognitoIdentityProviderService.'

export type OperationResolver = (
  body: Record<string, unknown>,
) => unknown

/**
 * Recursively converts Date objects to epoch seconds (numbers),
 * matching the Cognito JSON wire format (application/x-amz-json-1.1).
 */
function serializeDates(value: unknown): unknown {
  if (value instanceof Date) return Math.floor(value.getTime() / 1000)
  if (Array.isArray(value)) return value.map(serializeDates)
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeDates(val)
    }
    return result
  }
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Creates an MSW handler that dispatches Cognito SDK requests to the
 * appropriate operation resolver based on the X-Amz-Target header.
 *
 * Each domain handler file exports a Record<string, OperationResolver>
 * mapping operation names to their resolvers. These are merged and passed
 * to this function to create a single efficient dispatcher.
 */
export function createCognitoHandler(
  operations: Record<string, OperationResolver>,
): HttpHandler {
  return http.post('*', async ({ request }) => {
    const target = request.headers.get('X-Amz-Target')
    if (target === null || !target.startsWith(COGNITO_TARGET_PREFIX)) {
      return
    }

    const operationName = target.slice(COGNITO_TARGET_PREFIX.length)
    const resolver = operations[operationName]
    if (resolver === undefined) {
      return
    }

    try {
      const requestBody: unknown = await request.json()
      const body = isRecord(requestBody) ? requestBody : {}
      const resolverResult: unknown = await Promise.resolve(resolver(body))
      const result = serializeDates(resolverResult)
      const jsonBody = isRecord(result) ? result : {}
      return HttpResponse.json(jsonBody, {
        headers: { 'Content-Type': 'application/x-amz-json-1.1' },
      })
    } catch (error: unknown) {
      if (error instanceof StoreError) {
        return HttpResponse.json(
          { __type: error.code, message: error.message },
          {
            status: 400,
            headers: { 'Content-Type': 'application/x-amz-json-1.1' },
          },
        )
      }
      throw error
    }
  })
}
