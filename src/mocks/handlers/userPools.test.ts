import { describe, it, expect, beforeEach } from 'vitest'
import { userPoolStore } from '../stores/userPoolStore'

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function prop(obj: unknown, key: string): unknown {
  return isRecord(obj) ? obj[key] : undefined
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

async function getJson(response: Response): Promise<unknown> {
  const data: unknown = await response.json()
  return data
}

async function createPool(name: string): Promise<string> {
  const response = await cognitoRequest('CreateUserPool', { PoolName: name })
  const data = await getJson(response)
  return str(prop(prop(data, 'UserPool'), 'Id'))
}

describe('userPools MSW handlers', () => {
  beforeEach(() => {
    userPoolStore.clear()
  })

  describe('CreateUserPool', () => {
    it('creates a pool and returns it', async () => {
      const response = await cognitoRequest('CreateUserPool', {
        PoolName: 'TestPool',
      })
      expect(response.ok).toBe(true)
      const data = await getJson(response)
      expect(prop(prop(data, 'UserPool'), 'Name')).toBe('TestPool')
      expect(prop(prop(data, 'UserPool'), 'Id')).toBeDefined()
    })

    it('returns 400 for duplicate name', async () => {
      await cognitoRequest('CreateUserPool', { PoolName: 'DupPool' })
      const response = await cognitoRequest('CreateUserPool', {
        PoolName: 'DupPool',
      })
      expect(response.status).toBe(400)
      const data = await getJson(response)
      expect(prop(data, '__type')).toBe('ResourceExistsException')
    })
  })

  describe('ListUserPools', () => {
    it('returns empty list initially', async () => {
      const response = await cognitoRequest('ListUserPools', {
        MaxResults: 10,
      })
      expect(response.ok).toBe(true)
      const data = await getJson(response)
      const pools = prop(data, 'UserPools')
      expect(Array.isArray(pools)).toBe(true)
      if (Array.isArray(pools)) {
        expect(pools).toHaveLength(0)
      }
    })

    it('returns created pools', async () => {
      await createPool('Pool1')
      await createPool('Pool2')

      const response = await cognitoRequest('ListUserPools', { MaxResults: 10 })
      const data = await getJson(response)
      const pools = prop(data, 'UserPools')
      expect(Array.isArray(pools)).toBe(true)
      if (Array.isArray(pools)) {
        expect(pools).toHaveLength(2)
      }
    })

    it('supports pagination', async () => {
      for (let i = 0; i < 3; i++) {
        await createPool(`Pool${String(i)}`)
      }

      const page1Response = await cognitoRequest('ListUserPools', { MaxResults: 2 })
      const page1 = await getJson(page1Response)
      const page1Pools = prop(page1, 'UserPools')
      expect(Array.isArray(page1Pools) && page1Pools.length).toBe(2)
      const nextToken = prop(page1, 'NextToken')
      expect(nextToken).toBeDefined()

      const page2Response = await cognitoRequest('ListUserPools', {
        MaxResults: 2,
        NextToken: nextToken,
      })
      const page2 = await getJson(page2Response)
      const page2Pools = prop(page2, 'UserPools')
      expect(Array.isArray(page2Pools) && page2Pools.length).toBe(1)
      expect(prop(page2, 'NextToken')).toBeUndefined()
    })
  })

  describe('DescribeUserPool', () => {
    it('returns a pool by ID', async () => {
      const poolId = await createPool('DescPool')

      const response = await cognitoRequest('DescribeUserPool', {
        UserPoolId: poolId,
      })
      expect(response.ok).toBe(true)
      const data = await getJson(response)
      expect(prop(prop(data, 'UserPool'), 'Name')).toBe('DescPool')
    })

    it('returns 400 for non-existent pool', async () => {
      const response = await cognitoRequest('DescribeUserPool', {
        UserPoolId: 'non-existent',
      })
      expect(response.status).toBe(400)
    })
  })

  describe('UpdateUserPool', () => {
    it('updates pool properties', async () => {
      const poolId = await createPool('UpdatePool')

      const response = await cognitoRequest('UpdateUserPool', {
        UserPoolId: poolId,
        DeletionProtection: 'ACTIVE',
      })
      expect(response.ok).toBe(true)

      const descResponse = await cognitoRequest('DescribeUserPool', {
        UserPoolId: poolId,
      })
      const desc = await getJson(descResponse)
      expect(prop(prop(desc, 'UserPool'), 'DeletionProtection')).toBe('ACTIVE')
    })
  })

  describe('DeleteUserPool', () => {
    it('deletes a pool', async () => {
      const poolId = await createPool('DeletePool')

      const response = await cognitoRequest('DeleteUserPool', {
        UserPoolId: poolId,
      })
      expect(response.ok).toBe(true)

      const descResponse = await cognitoRequest('DescribeUserPool', {
        UserPoolId: poolId,
      })
      expect(descResponse.status).toBe(400)
    })

    it('returns 400 when deletion protection is active', async () => {
      const poolId = await createPool('ProtectedPool')
      await cognitoRequest('UpdateUserPool', {
        UserPoolId: poolId,
        DeletionProtection: 'ACTIVE',
      })

      const response = await cognitoRequest('DeleteUserPool', {
        UserPoolId: poolId,
      })
      expect(response.status).toBe(400)
    })
  })

  describe('AddCustomAttributes', () => {
    it('adds custom attributes to a pool', async () => {
      const poolId = await createPool('AttrPool')

      const response = await cognitoRequest('AddCustomAttributes', {
        UserPoolId: poolId,
        CustomAttributes: [
          { Name: 'tenant_id', AttributeDataType: 'String' },
        ],
      })
      expect(response.ok).toBe(true)
    })
  })

  describe('GetUserPoolMfaConfig / SetUserPoolMfaConfig', () => {
    it('returns OFF by default', async () => {
      const poolId = await createPool('MfaPool')

      const response = await cognitoRequest('GetUserPoolMfaConfig', {
        UserPoolId: poolId,
      })
      expect(response.ok).toBe(true)
      const data = await getJson(response)
      expect(prop(data, 'MfaConfiguration')).toBe('OFF')
    })

    it('sets and retrieves MFA configuration', async () => {
      const poolId = await createPool('MfaPool2')

      await cognitoRequest('SetUserPoolMfaConfig', {
        UserPoolId: poolId,
        MfaConfiguration: 'OPTIONAL',
        SoftwareTokenMfaConfiguration: { Enabled: true },
      })

      const response = await cognitoRequest('GetUserPoolMfaConfig', {
        UserPoolId: poolId,
      })
      const data = await getJson(response)
      expect(prop(data, 'MfaConfiguration')).toBe('OPTIONAL')
      expect(prop(prop(data, 'SoftwareTokenMfaConfiguration'), 'Enabled')).toBe(true)
    })
  })
})
