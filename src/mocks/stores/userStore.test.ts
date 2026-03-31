import { describe, it, expect, beforeEach } from 'vitest'
import { userStore } from './userStore'
import { StoreError } from './baseStore'

describe('userStore', () => {
  const POOL_ID = 'us-east-1_TestPool'

  beforeEach(() => {
    userStore.clear()
  })

  describe('create', () => {
    it('creates a user with required fields', () => {
      const user = userStore.create(POOL_ID, {
        Username: 'alice',
        UserAttributes: [
          { Name: 'email', Value: 'alice@example.com' },
        ],
      })
      expect(user.Username).toBe('alice')
      expect(user.Enabled).toBe(true)
      expect(user.UserStatus).toBe('FORCE_CHANGE_PASSWORD')
      expect(user.UserCreateDate).toBeInstanceOf(Date)
      expect(user.UserLastModifiedDate).toBeInstanceOf(Date)
    })

    it('auto-generates sub attribute', () => {
      const user = userStore.create(POOL_ID, { Username: 'bob' })
      const sub = user.Attributes?.find((a) => a.Name === 'sub')
      expect(sub?.Value).toBeDefined()
    })

    it('throws when Username is missing', () => {
      expect(() => {
        userStore.create(POOL_ID, {})
      }).toThrow(StoreError)
    })

    it('throws on duplicate username in same pool', () => {
      userStore.create(POOL_ID, { Username: 'dup' })
      expect(() => {
        userStore.create(POOL_ID, { Username: 'dup' })
      }).toThrow(StoreError)
    })

    it('allows same username in different pools', () => {
      userStore.create('pool-1', { Username: 'shared' })
      expect(() => {
        userStore.create('pool-2', { Username: 'shared' })
      }).not.toThrow()
    })
  })

  describe('getUser', () => {
    it('returns a created user', () => {
      userStore.create(POOL_ID, { Username: 'alice' })
      const user = userStore.getUser(POOL_ID, 'alice')
      expect(user.Username).toBe('alice')
    })

    it('throws for non-existent user', () => {
      expect(() => {
        userStore.getUser(POOL_ID, 'nobody')
      }).toThrow(StoreError)
    })
  })

  describe('deleteUser', () => {
    it('deletes a user', () => {
      userStore.create(POOL_ID, { Username: 'del' })
      userStore.deleteUser(POOL_ID, 'del')
      expect(() => {
        userStore.getUser(POOL_ID, 'del')
      }).toThrow(StoreError)
    })

    it('throws for non-existent user', () => {
      expect(() => {
        userStore.deleteUser(POOL_ID, 'nobody')
      }).toThrow(StoreError)
    })
  })

  describe('enableUser / disableUser', () => {
    it('disables and re-enables a user', () => {
      userStore.create(POOL_ID, { Username: 'toggle' })

      userStore.disableUser(POOL_ID, 'toggle')
      let user = userStore.getUser(POOL_ID, 'toggle')
      expect(user.Enabled).toBe(false)

      userStore.enableUser(POOL_ID, 'toggle')
      user = userStore.getUser(POOL_ID, 'toggle')
      expect(user.Enabled).toBe(true)
    })
  })

  describe('confirmSignUp', () => {
    it('sets user status to CONFIRMED', () => {
      userStore.create(POOL_ID, { Username: 'unconfirmed' })
      userStore.confirmSignUp(POOL_ID, 'unconfirmed')
      const user = userStore.getUser(POOL_ID, 'unconfirmed')
      expect(user.UserStatus).toBe('CONFIRMED')
    })
  })

  describe('resetPassword', () => {
    it('sets user status to RESET_REQUIRED', () => {
      userStore.create(POOL_ID, { Username: 'resetme' })
      userStore.confirmSignUp(POOL_ID, 'resetme')
      userStore.resetPassword(POOL_ID, 'resetme')
      const user = userStore.getUser(POOL_ID, 'resetme')
      expect(user.UserStatus).toBe('RESET_REQUIRED')
    })
  })

  describe('setPassword', () => {
    it('sets permanent password and confirms user', () => {
      userStore.create(POOL_ID, { Username: 'pwuser' })
      userStore.setPassword(POOL_ID, 'pwuser', 'NewP@ss1', true)
      const user = userStore.getUser(POOL_ID, 'pwuser')
      expect(user.UserStatus).toBe('CONFIRMED')
    })

    it('sets temporary password', () => {
      userStore.create(POOL_ID, { Username: 'tmpuser' })
      userStore.setPassword(POOL_ID, 'tmpuser', 'TmpP@ss1', false)
      const user = userStore.getUser(POOL_ID, 'tmpuser')
      expect(user.UserStatus).toBe('FORCE_CHANGE_PASSWORD')
    })
  })

  describe('updateAttributes / deleteAttributes', () => {
    it('updates user attributes', () => {
      userStore.create(POOL_ID, {
        Username: 'attruser',
        UserAttributes: [{ Name: 'email', Value: 'old@example.com' }],
      })
      userStore.updateAttributes(POOL_ID, 'attruser', [
        { Name: 'email', Value: 'new@example.com' },
      ])
      const user = userStore.getUser(POOL_ID, 'attruser')
      const email = user.Attributes?.find((a) => a.Name === 'email')
      expect(email?.Value).toBe('new@example.com')
    })

    it('adds new attributes', () => {
      userStore.create(POOL_ID, { Username: 'addattr' })
      userStore.updateAttributes(POOL_ID, 'addattr', [
        { Name: 'custom:role', Value: 'admin' },
      ])
      const user = userStore.getUser(POOL_ID, 'addattr')
      const role = user.Attributes?.find((a) => a.Name === 'custom:role')
      expect(role?.Value).toBe('admin')
    })

    it('deletes user attributes', () => {
      userStore.create(POOL_ID, {
        Username: 'delattr',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'phone_number', Value: '+1234567890' },
        ],
      })
      userStore.deleteAttributes(POOL_ID, 'delattr', ['phone_number'])
      const user = userStore.getUser(POOL_ID, 'delattr')
      const phone = user.Attributes?.find((a) => a.Name === 'phone_number')
      expect(phone).toBeUndefined()
    })
  })

  describe('group membership', () => {
    it('adds and removes user from groups', () => {
      userStore.create(POOL_ID, { Username: 'grpuser' })

      userStore.addToGroup(POOL_ID, 'grpuser', 'Admins')
      userStore.addToGroup(POOL_ID, 'grpuser', 'Users')

      let groups = userStore.listGroupsForUser(POOL_ID, 'grpuser')
      expect(groups).toHaveLength(2)

      userStore.removeFromGroup(POOL_ID, 'grpuser', 'Admins')
      groups = userStore.listGroupsForUser(POOL_ID, 'grpuser')
      expect(groups).toHaveLength(1)
      expect(groups[0]?.GroupName).toBe('Users')
    })
  })

  describe('listUsers', () => {
    it('returns empty list initially', () => {
      const result = userStore.listUsers(POOL_ID, 10)
      expect(result.Users).toHaveLength(0)
      expect(result.NextToken).toBeUndefined()
    })

    it('returns users for a specific pool', () => {
      userStore.create(POOL_ID, { Username: 'user1' })
      userStore.create(POOL_ID, { Username: 'user2' })
      userStore.create('other-pool', { Username: 'other' })

      const result = userStore.listUsers(POOL_ID, 10)
      expect(result.Users).toHaveLength(2)
    })

    it('paginates correctly', () => {
      for (let i = 0; i < 5; i++) {
        userStore.create(POOL_ID, { Username: `page${String(i)}` })
      }

      const page1 = userStore.listUsers(POOL_ID, 2)
      expect(page1.Users).toHaveLength(2)
      expect(page1.NextToken).toBeDefined()

      const page2 = userStore.listUsers(POOL_ID, 2, page1.NextToken)
      expect(page2.Users).toHaveLength(2)
      expect(page2.NextToken).toBeDefined()

      const page3 = userStore.listUsers(POOL_ID, 2, page2.NextToken)
      expect(page3.Users).toHaveLength(1)
      expect(page3.NextToken).toBeUndefined()
    })

    it('filters by status', () => {
      userStore.create(POOL_ID, { Username: 'confirmed' })
      userStore.confirmSignUp(POOL_ID, 'confirmed')
      userStore.create(POOL_ID, { Username: 'unconfirmed' })

      const result = userStore.listUsers(POOL_ID, 10, undefined, 'status = "CONFIRMED"')
      expect(result.Users).toHaveLength(1)
      expect(result.Users[0]?.Username).toBe('confirmed')
    })

    it('filters by email prefix', () => {
      userStore.create(POOL_ID, {
        Username: 'alice',
        UserAttributes: [{ Name: 'email', Value: 'alice@example.com' }],
      })
      userStore.create(POOL_ID, {
        Username: 'bob',
        UserAttributes: [{ Name: 'email', Value: 'bob@example.com' }],
      })

      const result = userStore.listUsers(POOL_ID, 10, undefined, 'email ^= "alice"')
      expect(result.Users).toHaveLength(1)
      expect(result.Users[0]?.Username).toBe('alice')
    })
  })

  describe('setMfaPreference', () => {
    it('sets SMS MFA preference', () => {
      userStore.create(POOL_ID, { Username: 'mfauser' })
      userStore.setMfaPreference(
        POOL_ID,
        'mfauser',
        { Enabled: true, PreferredMfa: true },
        undefined,
      )
      // Verify user still exists (store update didn't throw)
      const user = userStore.getUser(POOL_ID, 'mfauser')
      expect(user.Username).toBe('mfauser')
    })
  })
})
