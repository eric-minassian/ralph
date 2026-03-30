import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { createCognitoHandler } from './cognitoHandler'
import type { OperationResolver } from './cognitoHandler'
import { StoreError } from '../stores/baseStore'

const operations: Record<string, OperationResolver> = {
  ListUserPools: (body) => ({
    UserPools: [],
    MaxResults: body['MaxResults'] ?? 10,
  }),
  FailingOperation: () => {
    throw new StoreError('ResourceNotFoundException', 'Pool not found')
  },
}

const server = setupServer(createCognitoHandler(operations))

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

function cognitoRequest(
  operation: string,
  body: Record<string, unknown> = {},
): Promise<Response> {
  return fetch('https://cognito-idp.us-east-1.amazonaws.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${operation}`,
    },
    body: JSON.stringify(body),
  })
}

describe('createCognitoHandler', () => {
  it('dispatches to the correct operation resolver', async () => {
    const response = await cognitoRequest('ListUserPools', { MaxResults: 5 })
    expect(response.ok).toBe(true)
    const data: unknown = await response.json()
    expect(data).toEqual({ UserPools: [], MaxResults: 5 })
  })

  it('returns application/x-amz-json-1.1 content type', async () => {
    const response = await cognitoRequest('ListUserPools')
    expect(response.headers.get('Content-Type')).toContain(
      'application/x-amz-json-1.1',
    )
  })

  it('returns 400 with error shape for StoreError', async () => {
    const response = await cognitoRequest('FailingOperation')
    expect(response.status).toBe(400)
    const data: unknown = await response.json()
    expect(data).toEqual({
      __type: 'ResourceNotFoundException',
      message: 'Pool not found',
    })
  })

  it('passes through non-Cognito requests', async () => {
    const response = await fetch('https://example.com/api', {
      method: 'POST',
    })
    // Non-Cognito request should pass through (not intercepted)
    // The response may fail since there's no real server, but it shouldn't
    // be handled by our Cognito handler
    expect(response.headers.get('Content-Type')).not.toContain(
      'application/x-amz-json-1.1',
    )
  })
})
