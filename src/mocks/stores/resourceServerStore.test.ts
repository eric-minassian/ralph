import { describe, it, expect, beforeEach } from 'vitest'
import { resourceServerStore } from './resourceServerStore'

const POOL_ID = 'us-east-1_TestPool'

describe('ResourceServerStore', () => {
  beforeEach(() => {
    resourceServerStore.clear()
  })

  describe('create', () => {
    it('creates a resource server with identifier and name', () => {
      const rs = resourceServerStore.create(POOL_ID, {
        Identifier: 'https://api.example.com',
        Name: 'Example API',
      })
      expect(rs.Identifier).toBe('https://api.example.com')
      expect(rs.Name).toBe('Example API')
      expect(rs.UserPoolId).toBe(POOL_ID)
      expect(rs.Scopes).toEqual([])
    })

    it('creates a resource server with scopes', () => {
      const rs = resourceServerStore.create(POOL_ID, {
        Identifier: 'https://api.example.com',
        Name: 'Example API',
        Scopes: [
          { ScopeName: 'read', ScopeDescription: 'Read access' },
          { ScopeName: 'write', ScopeDescription: 'Write access' },
        ],
      })
      expect(rs.Scopes).toHaveLength(2)
      expect(rs.Scopes?.[0]?.ScopeName).toBe('read')
      expect(rs.Scopes?.[1]?.ScopeName).toBe('write')
    })

    it('throws on missing identifier', () => {
      expect(() => resourceServerStore.create(POOL_ID, { Name: 'Test' })).toThrow('Identifier is required')
    })

    it('throws on missing name', () => {
      expect(() => resourceServerStore.create(POOL_ID, { Identifier: 'https://test.com' })).toThrow('Name is required')
    })

    it('throws on duplicate identifier', () => {
      resourceServerStore.create(POOL_ID, { Identifier: 'https://dup.com', Name: 'First' })
      expect(() => resourceServerStore.create(POOL_ID, { Identifier: 'https://dup.com', Name: 'Second' })).toThrow()
    })
  })

  describe('describe', () => {
    it('returns a created resource server', () => {
      resourceServerStore.create(POOL_ID, { Identifier: 'https://test.com', Name: 'Test' })
      const rs = resourceServerStore.describe(POOL_ID, 'https://test.com')
      expect(rs.Name).toBe('Test')
    })

    it('throws when not found', () => {
      expect(() => resourceServerStore.describe(POOL_ID, 'https://missing.com')).toThrow()
    })
  })

  describe('update', () => {
    it('updates name', () => {
      resourceServerStore.create(POOL_ID, { Identifier: 'https://test.com', Name: 'Old' })
      const rs = resourceServerStore.update(POOL_ID, { Identifier: 'https://test.com', Name: 'New' })
      expect(rs.Name).toBe('New')
    })

    it('updates scopes', () => {
      resourceServerStore.create(POOL_ID, {
        Identifier: 'https://test.com',
        Name: 'Test',
        Scopes: [{ ScopeName: 'old', ScopeDescription: 'Old' }],
      })
      const rs = resourceServerStore.update(POOL_ID, {
        Identifier: 'https://test.com',
        Scopes: [{ ScopeName: 'new', ScopeDescription: 'New scope' }],
      })
      expect(rs.Scopes).toHaveLength(1)
      expect(rs.Scopes?.[0]?.ScopeName).toBe('new')
    })

    it('throws on missing identifier', () => {
      expect(() => resourceServerStore.update(POOL_ID, { Name: 'Test' })).toThrow('Identifier is required')
    })

    it('throws when not found', () => {
      expect(() => resourceServerStore.update(POOL_ID, { Identifier: 'https://missing.com', Name: 'Test' })).toThrow()
    })
  })

  describe('delete', () => {
    it('deletes a resource server', () => {
      resourceServerStore.create(POOL_ID, { Identifier: 'https://del.com', Name: 'Delete Me' })
      resourceServerStore.delete(POOL_ID, 'https://del.com')
      expect(() => resourceServerStore.describe(POOL_ID, 'https://del.com')).toThrow()
    })

    it('throws when not found', () => {
      expect(() => resourceServerStore.delete(POOL_ID, 'https://missing.com')).toThrow()
    })
  })

  describe('list', () => {
    it('returns empty list', () => {
      const result = resourceServerStore.list(POOL_ID, 10)
      expect(result.ResourceServers).toEqual([])
      expect(result.NextToken).toBeUndefined()
    })

    it('returns all resource servers for the pool', () => {
      resourceServerStore.create(POOL_ID, { Identifier: 'https://a.com', Name: 'A' })
      resourceServerStore.create(POOL_ID, { Identifier: 'https://b.com', Name: 'B' })
      resourceServerStore.create('other-pool', { Identifier: 'https://c.com', Name: 'C' })

      const result = resourceServerStore.list(POOL_ID, 10)
      expect(result.ResourceServers).toHaveLength(2)
    })

    it('paginates results', () => {
      for (let i = 0; i < 5; i++) {
        resourceServerStore.create(POOL_ID, { Identifier: `https://${String(i)}.com`, Name: `Server ${String(i)}` })
      }
      const page1 = resourceServerStore.list(POOL_ID, 2)
      expect(page1.ResourceServers).toHaveLength(2)
      expect(page1.NextToken).toBe('2')

      const page2 = resourceServerStore.list(POOL_ID, 2, page1.NextToken)
      expect(page2.ResourceServers).toHaveLength(2)
      expect(page2.NextToken).toBe('4')

      const page3 = resourceServerStore.list(POOL_ID, 2, page2.NextToken)
      expect(page3.ResourceServers).toHaveLength(1)
      expect(page3.NextToken).toBeUndefined()
    })
  })

  describe('seed', () => {
    it('creates sample resource servers', () => {
      resourceServerStore.seed(POOL_ID)
      const result = resourceServerStore.list(POOL_ID, 10)
      expect(result.ResourceServers).toHaveLength(2)
      expect(result.ResourceServers[0]?.Identifier).toBe('https://api.example.com')
      expect(result.ResourceServers[1]?.Identifier).toBe('https://orders.example.com')
    })
  })
})
