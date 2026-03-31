import { describe, it, expect, beforeEach } from 'vitest'
import { userPoolStore } from './userPoolStore'
import { StoreError } from './baseStore'

describe('userPoolStore', () => {
  beforeEach(() => {
    userPoolStore.clear()
  })

  describe('create', () => {
    it('creates a user pool with required fields', () => {
      const pool = userPoolStore.create({ PoolName: 'TestPool' })
      expect(pool.Name).toBe('TestPool')
      expect(pool.Id).toBeDefined()
      expect(pool.CreationDate).toBeInstanceOf(Date)
      expect(pool.LastModifiedDate).toBeInstanceOf(Date)
    })

    it('throws when PoolName is missing', () => {
      expect(() => {
        userPoolStore.create({})
      }).toThrow(StoreError)
    })

    it('throws on duplicate name', () => {
      userPoolStore.create({ PoolName: 'DupPool' })
      expect(() => {
        userPoolStore.create({ PoolName: 'DupPool' })
      }).toThrow(StoreError)
    })

    it('applies default password policy', () => {
      const pool = userPoolStore.create({ PoolName: 'WithDefaults' })
      expect(pool.Policies?.PasswordPolicy?.MinimumLength).toBe(8)
    })
  })

  describe('describe', () => {
    it('returns a created pool by ID', () => {
      const created = userPoolStore.create({ PoolName: 'MyPool' })
      const described = userPoolStore.describe(created.Id ?? '')
      expect(described.Name).toBe('MyPool')
    })

    it('throws for non-existent pool', () => {
      expect(() => {
        userPoolStore.describe('non-existent')
      }).toThrow(StoreError)
    })
  })

  describe('update', () => {
    it('updates pool properties', () => {
      const created = userPoolStore.create({ PoolName: 'Original' })
      const updated = userPoolStore.update({
        UserPoolId: created.Id,
        DeletionProtection: 'ACTIVE',
      })
      expect(updated.DeletionProtection).toBe('ACTIVE')
    })

    it('throws when UserPoolId is missing', () => {
      expect(() => {
        userPoolStore.update({})
      }).toThrow(StoreError)
    })

    it('updates LastModifiedDate', () => {
      const created = userPoolStore.create({ PoolName: 'DateCheck' })
      const originalDate = created.LastModifiedDate
      const updated = userPoolStore.update({
        UserPoolId: created.Id,
        DeletionProtection: 'INACTIVE',
      })
      expect(updated.LastModifiedDate?.getTime()).toBeGreaterThanOrEqual(
        originalDate?.getTime() ?? 0,
      )
    })
  })

  describe('delete', () => {
    it('deletes a pool', () => {
      const created = userPoolStore.create({
        PoolName: 'ToDelete',
        DeletionProtection: 'INACTIVE',
      })
      userPoolStore.delete(created.Id ?? '')
      expect(() => {
        userPoolStore.describe(created.Id ?? '')
      }).toThrow(StoreError)
    })

    it('throws when deletion protection is active', () => {
      const created = userPoolStore.create({ PoolName: 'Protected' })
      userPoolStore.update({
        UserPoolId: created.Id,
        DeletionProtection: 'ACTIVE',
      })
      expect(() => {
        userPoolStore.delete(created.Id ?? '')
      }).toThrow(StoreError)
    })

    it('throws for non-existent pool', () => {
      expect(() => {
        userPoolStore.delete('non-existent')
      }).toThrow(StoreError)
    })
  })

  describe('list', () => {
    it('returns empty list initially', () => {
      const result = userPoolStore.list(10)
      expect(result.UserPools).toHaveLength(0)
      expect(result.NextToken).toBeUndefined()
    })

    it('returns all pools', () => {
      userPoolStore.create({ PoolName: 'Pool1' })
      userPoolStore.create({ PoolName: 'Pool2' })
      const result = userPoolStore.list(10)
      expect(result.UserPools).toHaveLength(2)
    })

    it('paginates correctly', () => {
      for (let i = 0; i < 5; i++) {
        userPoolStore.create({ PoolName: `Pool${String(i)}` })
      }
      const page1 = userPoolStore.list(2)
      expect(page1.UserPools).toHaveLength(2)
      expect(page1.NextToken).toBeDefined()

      const page2 = userPoolStore.list(2, page1.NextToken)
      expect(page2.UserPools).toHaveLength(2)
      expect(page2.NextToken).toBeDefined()

      const page3 = userPoolStore.list(2, page2.NextToken)
      expect(page3.UserPools).toHaveLength(1)
      expect(page3.NextToken).toBeUndefined()
    })

    it('returns description-level fields only', () => {
      userPoolStore.create({ PoolName: 'DescTest' })
      const result = userPoolStore.list(10)
      const pool = result.UserPools[0]
      expect(pool).toBeDefined()
      expect(pool?.Id).toBeDefined()
      expect(pool?.Name).toBe('DescTest')
      expect(pool?.CreationDate).toBeDefined()
      expect(pool?.LastModifiedDate).toBeDefined()
    })
  })

  describe('addCustomAttributes', () => {
    it('adds custom attributes to a pool', () => {
      const created = userPoolStore.create({ PoolName: 'AttrPool' })
      userPoolStore.addCustomAttributes(created.Id ?? '', [
        { Name: 'tenant_id', AttributeDataType: 'String' },
      ])
      const pool = userPoolStore.describe(created.Id ?? '')
      const customAttr = pool.SchemaAttributes?.find(
        (a) => a.Name === 'custom:tenant_id',
      )
      expect(customAttr).toBeDefined()
    })

    it('throws on duplicate attribute', () => {
      const created = userPoolStore.create({ PoolName: 'DupAttr' })
      userPoolStore.addCustomAttributes(created.Id ?? '', [
        { Name: 'tenant_id' },
      ])
      expect(() => {
        userPoolStore.addCustomAttributes(created.Id ?? '', [
          { Name: 'tenant_id' },
        ])
      }).toThrow(StoreError)
    })
  })

  describe('MFA config', () => {
    it('returns OFF by default', () => {
      const created = userPoolStore.create({ PoolName: 'MfaPool' })
      const config = userPoolStore.getMfaConfig(created.Id ?? '')
      expect(config.MfaConfiguration).toBe('OFF')
    })

    it('sets MFA configuration', () => {
      const created = userPoolStore.create({ PoolName: 'MfaPool2' })
      const result = userPoolStore.setMfaConfig({
        UserPoolId: created.Id,
        MfaConfiguration: 'OPTIONAL',
        SoftwareTokenMfaConfiguration: { Enabled: true },
      })
      expect(result.MfaConfiguration).toBe('OPTIONAL')
      expect(result.SoftwareTokenMfaConfiguration).toEqual({ Enabled: true })

      const config = userPoolStore.getMfaConfig(created.Id ?? '')
      expect(config.MfaConfiguration).toBe('OPTIONAL')
    })

    it('throws for non-existent pool', () => {
      expect(() => {
        userPoolStore.getMfaConfig('non-existent')
      }).toThrow(StoreError)
    })
  })
})
