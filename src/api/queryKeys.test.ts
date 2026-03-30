import { describe, it, expect } from 'vitest'
import { queryKey, queryKeys } from './queryKeys'

describe('queryKey', () => {
  it('produces keys with the correct structure', () => {
    expect(queryKey('userPools', 'list')).toEqual([
      'cognito',
      'userPools',
      'list',
    ])
  })

  it('appends params to the key', () => {
    expect(queryKey('users', 'detail', 'pool-1', 'user-1')).toEqual([
      'cognito',
      'users',
      'detail',
      'pool-1',
      'user-1',
    ])
  })
})

describe('queryKeys', () => {
  it('has a top-level all key', () => {
    expect(queryKeys.all).toEqual(['cognito'])
  })

  it('creates domain-level all keys', () => {
    expect(queryKeys.userPools.all).toEqual(['cognito', 'userPools'])
    expect(queryKeys.users.all).toEqual(['cognito', 'users'])
    expect(queryKeys.groups.all).toEqual(['cognito', 'groups'])
  })

  it('creates domain list keys', () => {
    expect(queryKeys.userPools.list()).toEqual([
      'cognito',
      'userPools',
      'list',
    ])
    expect(queryKeys.users.list('pool-1')).toEqual([
      'cognito',
      'users',
      'list',
      'pool-1',
    ])
  })

  it('creates domain detail keys', () => {
    expect(queryKeys.userPools.detail('pool-1')).toEqual([
      'cognito',
      'userPools',
      'detail',
      'pool-1',
    ])
    expect(queryKeys.groups.detail('pool-1', 'admins')).toEqual([
      'cognito',
      'groups',
      'detail',
      'pool-1',
      'admins',
    ])
  })

  it('has all 15 domain key sets', () => {
    const domains = [
      'userPools',
      'users',
      'groups',
      'appClients',
      'identityProviders',
      'domains',
      'resourceServers',
      'userImport',
      'security',
      'branding',
      'devices',
      'webauthn',
      'mfa',
      'tags',
      'terms',
    ] as const

    for (const domain of domains) {
      expect(queryKeys[domain]).toBeDefined()
      expect(queryKeys[domain].all).toEqual(['cognito', domain])
      expect(typeof queryKeys[domain].list).toBe('function')
      expect(typeof queryKeys[domain].detail).toBe('function')
    }
  })
})
