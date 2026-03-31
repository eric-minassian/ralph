import { describe, it, expect, beforeEach } from 'vitest'
import { groupStore } from './groupStore'
import { userStore } from './userStore'

const POOL_ID = 'us-east-1_TestPool'

describe('GroupStore', () => {
  beforeEach(() => {
    groupStore.clear()
    userStore.clear()
  })

  describe('create', () => {
    it('creates a group with required fields', () => {
      const group = groupStore.create(POOL_ID, { GroupName: 'Admins' })
      expect(group.GroupName).toBe('Admins')
      expect(group.UserPoolId).toBe(POOL_ID)
      expect(group.CreationDate).toBeInstanceOf(Date)
      expect(group.LastModifiedDate).toBeInstanceOf(Date)
    })

    it('creates a group with all optional fields', () => {
      const group = groupStore.create(POOL_ID, {
        GroupName: 'Editors',
        Description: 'Editor group',
        Precedence: 10,
        RoleArn: 'arn:aws:iam::123456789012:role/CognitoEditorRole',
      })
      expect(group.Description).toBe('Editor group')
      expect(group.Precedence).toBe(10)
      expect(group.RoleArn).toBe('arn:aws:iam::123456789012:role/CognitoEditorRole')
    })

    it('throws on missing GroupName', () => {
      expect(() => groupStore.create(POOL_ID, {})).toThrow('GroupName is required')
    })

    it('throws on duplicate group name within same pool', () => {
      groupStore.create(POOL_ID, { GroupName: 'Admins' })
      expect(() => groupStore.create(POOL_ID, { GroupName: 'Admins' })).toThrow('already exists')
    })

    it('allows same group name in different pools', () => {
      groupStore.create('us-east-1_Pool1', { GroupName: 'Admins' })
      const group2 = groupStore.create('us-east-1_Pool2', { GroupName: 'Admins' })
      expect(group2.GroupName).toBe('Admins')
    })
  })

  describe('describe', () => {
    it('returns the group', () => {
      groupStore.create(POOL_ID, { GroupName: 'Admins', Description: 'Admin group' })
      const group = groupStore.describe(POOL_ID, 'Admins')
      expect(group.GroupName).toBe('Admins')
      expect(group.Description).toBe('Admin group')
    })

    it('throws on not found', () => {
      expect(() => groupStore.describe(POOL_ID, 'NoSuchGroup')).toThrow('not found')
    })
  })

  describe('update', () => {
    it('updates description and precedence', () => {
      groupStore.create(POOL_ID, { GroupName: 'Admins', Precedence: 1 })
      const updated = groupStore.update(POOL_ID, {
        GroupName: 'Admins',
        Description: 'Updated description',
        Precedence: 5,
      })
      expect(updated.Description).toBe('Updated description')
      expect(updated.Precedence).toBe(5)
    })

    it('throws on missing GroupName', () => {
      expect(() => groupStore.update(POOL_ID, {})).toThrow('GroupName is required')
    })

    it('throws on not found', () => {
      expect(() => groupStore.update(POOL_ID, { GroupName: 'NoSuch' })).toThrow('not found')
    })
  })

  describe('delete', () => {
    it('deletes a group', () => {
      groupStore.create(POOL_ID, { GroupName: 'Admins' })
      groupStore.delete(POOL_ID, 'Admins')
      expect(() => groupStore.describe(POOL_ID, 'Admins')).toThrow('not found')
    })

    it('throws on not found', () => {
      expect(() => groupStore.delete(POOL_ID, 'NoSuchGroup')).toThrow('not found')
    })
  })

  describe('list', () => {
    it('lists groups for a pool', () => {
      groupStore.create(POOL_ID, { GroupName: 'Admins' })
      groupStore.create(POOL_ID, { GroupName: 'Editors' })
      groupStore.create('us-east-1_Other', { GroupName: 'OtherGroup' })

      const result = groupStore.list(POOL_ID, 20)
      expect(result.Groups).toHaveLength(2)
      expect(result.NextToken).toBeUndefined()
    })

    it('paginates groups', () => {
      for (let i = 0; i < 5; i++) {
        groupStore.create(POOL_ID, { GroupName: `Group${String(i)}` })
      }

      const page1 = groupStore.list(POOL_ID, 2)
      expect(page1.Groups).toHaveLength(2)
      expect(page1.NextToken).toBe('2')

      const page2 = groupStore.list(POOL_ID, 2, page1.NextToken)
      expect(page2.Groups).toHaveLength(2)
      expect(page2.NextToken).toBe('4')

      const page3 = groupStore.list(POOL_ID, 2, page2.NextToken)
      expect(page3.Groups).toHaveLength(1)
      expect(page3.NextToken).toBeUndefined()
    })
  })

  describe('members', () => {
    beforeEach(() => {
      groupStore.create(POOL_ID, { GroupName: 'Admins' })
      userStore.create(POOL_ID, { Username: 'alice' })
      userStore.create(POOL_ID, { Username: 'bob' })
    })

    it('adds a user to a group', () => {
      groupStore.addUser(POOL_ID, 'Admins', 'alice')
      const result = groupStore.listUsersInGroup(POOL_ID, 'Admins', 20)
      expect(result.Users).toHaveLength(1)
      expect(result.Users[0]?.Username).toBe('alice')
    })

    it('removes a user from a group', () => {
      groupStore.addUser(POOL_ID, 'Admins', 'alice')
      groupStore.addUser(POOL_ID, 'Admins', 'bob')
      groupStore.removeUser(POOL_ID, 'Admins', 'alice')
      const result = groupStore.listUsersInGroup(POOL_ID, 'Admins', 20)
      expect(result.Users).toHaveLength(1)
      expect(result.Users[0]?.Username).toBe('bob')
    })

    it('returns empty when no members', () => {
      const result = groupStore.listUsersInGroup(POOL_ID, 'Admins', 20)
      expect(result.Users).toHaveLength(0)
    })

    it('throws when group not found for addUser', () => {
      expect(() => groupStore.addUser(POOL_ID, 'NoSuch', 'alice')).toThrow('not found')
    })

    it('paginates members', () => {
      for (let i = 0; i < 5; i++) {
        const username = `user${String(i)}`
        userStore.create(POOL_ID, { Username: username })
        groupStore.addUser(POOL_ID, 'Admins', username)
      }

      const page1 = groupStore.listUsersInGroup(POOL_ID, 'Admins', 2)
      expect(page1.Users).toHaveLength(2)
      expect(page1.NextToken).toBe('2')

      const page2 = groupStore.listUsersInGroup(POOL_ID, 'Admins', 2, page1.NextToken)
      expect(page2.Users).toHaveLength(2)
      expect(page2.NextToken).toBe('4')
    })
  })

  describe('seed', () => {
    it('seeds default groups', () => {
      groupStore.seed(POOL_ID)
      const result = groupStore.list(POOL_ID, 20)
      expect(result.Groups).toHaveLength(3)
      const names = result.Groups.map((g) => g.GroupName)
      expect(names).toContain('Admins')
      expect(names).toContain('Editors')
      expect(names).toContain('Viewers')
    })
  })
})
