import { describe, it, expect, beforeEach } from 'vitest'
import { userStore } from '../stores/userStore'

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

async function getJson(response: Response): Promise<unknown> {
  const data: unknown = await response.json()
  return data
}

const POOL_ID = 'us-east-1_TestPool'

async function createUser(username: string): Promise<void> {
  await cognitoRequest('AdminCreateUser', {
    UserPoolId: POOL_ID,
    Username: username,
    UserAttributes: [
      { Name: 'email', Value: `${username}@example.com` },
    ],
  })
}

describe('users MSW handlers', () => {
  beforeEach(() => {
    userStore.clear()
  })

  describe('AdminCreateUser', () => {
    it('creates a user and returns it', async () => {
      const response = await cognitoRequest('AdminCreateUser', {
        UserPoolId: POOL_ID,
        Username: 'alice',
        UserAttributes: [{ Name: 'email', Value: 'alice@example.com' }],
      })
      expect(response.ok).toBe(true)
      const data = await getJson(response)
      expect(prop(prop(data, 'User'), 'Username')).toBe('alice')
    })

    it('returns 400 for duplicate username', async () => {
      await createUser('dup')
      const response = await cognitoRequest('AdminCreateUser', {
        UserPoolId: POOL_ID,
        Username: 'dup',
      })
      expect(response.status).toBe(400)
      const data = await getJson(response)
      expect(prop(data, '__type')).toBe('UsernameExistsException')
    })
  })

  describe('AdminGetUser', () => {
    it('returns a user by username', async () => {
      await createUser('alice')

      const response = await cognitoRequest('AdminGetUser', {
        UserPoolId: POOL_ID,
        Username: 'alice',
      })
      expect(response.ok).toBe(true)
      const data = await getJson(response)
      expect(prop(data, 'Username')).toBe('alice')
      expect(prop(data, 'Enabled')).toBe(true)
    })

    it('returns 400 for non-existent user', async () => {
      const response = await cognitoRequest('AdminGetUser', {
        UserPoolId: POOL_ID,
        Username: 'nobody',
      })
      expect(response.status).toBe(400)
    })
  })

  describe('AdminDeleteUser', () => {
    it('deletes a user', async () => {
      await createUser('todelete')

      const response = await cognitoRequest('AdminDeleteUser', {
        UserPoolId: POOL_ID,
        Username: 'todelete',
      })
      expect(response.ok).toBe(true)

      const getResponse = await cognitoRequest('AdminGetUser', {
        UserPoolId: POOL_ID,
        Username: 'todelete',
      })
      expect(getResponse.status).toBe(400)
    })
  })

  describe('AdminEnableUser / AdminDisableUser', () => {
    it('disables and enables a user', async () => {
      await createUser('toggle')

      await cognitoRequest('AdminDisableUser', {
        UserPoolId: POOL_ID,
        Username: 'toggle',
      })

      let getResponse = await cognitoRequest('AdminGetUser', {
        UserPoolId: POOL_ID,
        Username: 'toggle',
      })
      let data = await getJson(getResponse)
      expect(prop(data, 'Enabled')).toBe(false)

      await cognitoRequest('AdminEnableUser', {
        UserPoolId: POOL_ID,
        Username: 'toggle',
      })

      getResponse = await cognitoRequest('AdminGetUser', {
        UserPoolId: POOL_ID,
        Username: 'toggle',
      })
      data = await getJson(getResponse)
      expect(prop(data, 'Enabled')).toBe(true)
    })
  })

  describe('AdminConfirmSignUp', () => {
    it('confirms a user', async () => {
      await createUser('toconfirm')

      const response = await cognitoRequest('AdminConfirmSignUp', {
        UserPoolId: POOL_ID,
        Username: 'toconfirm',
      })
      expect(response.ok).toBe(true)

      const getResponse = await cognitoRequest('AdminGetUser', {
        UserPoolId: POOL_ID,
        Username: 'toconfirm',
      })
      const data = await getJson(getResponse)
      expect(prop(data, 'UserStatus')).toBe('CONFIRMED')
    })
  })

  describe('AdminResetUserPassword', () => {
    it('resets user password', async () => {
      await createUser('resetme')

      await cognitoRequest('AdminResetUserPassword', {
        UserPoolId: POOL_ID,
        Username: 'resetme',
      })

      const getResponse = await cognitoRequest('AdminGetUser', {
        UserPoolId: POOL_ID,
        Username: 'resetme',
      })
      const data = await getJson(getResponse)
      expect(prop(data, 'UserStatus')).toBe('RESET_REQUIRED')
    })
  })

  describe('AdminSetUserPassword', () => {
    it('sets permanent password', async () => {
      await createUser('pwuser')

      const response = await cognitoRequest('AdminSetUserPassword', {
        UserPoolId: POOL_ID,
        Username: 'pwuser',
        Password: 'NewP@ss1',
        Permanent: true,
      })
      expect(response.ok).toBe(true)

      const getResponse = await cognitoRequest('AdminGetUser', {
        UserPoolId: POOL_ID,
        Username: 'pwuser',
      })
      const data = await getJson(getResponse)
      expect(prop(data, 'UserStatus')).toBe('CONFIRMED')
    })
  })

  describe('ListUsers', () => {
    it('returns empty list initially', async () => {
      const response = await cognitoRequest('ListUsers', {
        UserPoolId: POOL_ID,
        Limit: 10,
      })
      expect(response.ok).toBe(true)
      const data = await getJson(response)
      const users = prop(data, 'Users')
      expect(Array.isArray(users)).toBe(true)
      if (Array.isArray(users)) {
        expect(users).toHaveLength(0)
      }
    })

    it('returns created users', async () => {
      await createUser('user1')
      await createUser('user2')

      const response = await cognitoRequest('ListUsers', {
        UserPoolId: POOL_ID,
        Limit: 10,
      })
      const data = await getJson(response)
      const users = prop(data, 'Users')
      expect(Array.isArray(users)).toBe(true)
      if (Array.isArray(users)) {
        expect(users).toHaveLength(2)
      }
    })

    it('supports pagination', async () => {
      for (let i = 0; i < 3; i++) {
        await createUser(`paginated${String(i)}`)
      }

      const page1Response = await cognitoRequest('ListUsers', {
        UserPoolId: POOL_ID,
        Limit: 2,
      })
      const page1 = await getJson(page1Response)
      const page1Users = prop(page1, 'Users')
      expect(Array.isArray(page1Users) && page1Users.length).toBe(2)
      const nextToken = prop(page1, 'PaginationToken')
      expect(nextToken).toBeDefined()

      const page2Response = await cognitoRequest('ListUsers', {
        UserPoolId: POOL_ID,
        Limit: 2,
        PaginationToken: nextToken,
      })
      const page2 = await getJson(page2Response)
      const page2Users = prop(page2, 'Users')
      expect(Array.isArray(page2Users) && page2Users.length).toBe(1)
    })
  })

  describe('AdminUpdateUserAttributes', () => {
    it('updates user attributes', async () => {
      await createUser('attruser')

      const response = await cognitoRequest('AdminUpdateUserAttributes', {
        UserPoolId: POOL_ID,
        Username: 'attruser',
        UserAttributes: [{ Name: 'email', Value: 'updated@example.com' }],
      })
      expect(response.ok).toBe(true)
    })
  })

  describe('AdminAddUserToGroup / AdminRemoveUserFromGroup', () => {
    it('manages group membership', async () => {
      await createUser('grpuser')

      await cognitoRequest('AdminAddUserToGroup', {
        UserPoolId: POOL_ID,
        Username: 'grpuser',
        GroupName: 'Admins',
      })

      const listResponse = await cognitoRequest('AdminListGroupsForUser', {
        UserPoolId: POOL_ID,
        Username: 'grpuser',
      })
      const listData = await getJson(listResponse)
      const groups = prop(listData, 'Groups')
      expect(Array.isArray(groups) && groups.length).toBe(1)

      await cognitoRequest('AdminRemoveUserFromGroup', {
        UserPoolId: POOL_ID,
        Username: 'grpuser',
        GroupName: 'Admins',
      })

      const listResponse2 = await cognitoRequest('AdminListGroupsForUser', {
        UserPoolId: POOL_ID,
        Username: 'grpuser',
      })
      const listData2 = await getJson(listResponse2)
      const groups2 = prop(listData2, 'Groups')
      expect(Array.isArray(groups2) && groups2.length).toBe(0)
    })
  })
})
