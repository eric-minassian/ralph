import { describe, it, expect, beforeEach } from 'vitest'
import { domainStore } from './domainStore'

const POOL_ID = 'us-east-1_StoreTest'

describe('DomainStore', () => {
  beforeEach(() => {
    domainStore.clear()
  })

  it('creates a prefix domain', () => {
    const domain = domainStore.create(POOL_ID, {
      Domain: 'my-prefix',
      UserPoolId: POOL_ID,
    })
    expect(domain.Domain).toBe('my-prefix')
    expect(domain.UserPoolId).toBe(POOL_ID)
    expect(domain.Status).toBe('ACTIVE')
    expect(domain.CustomDomainConfig).toBeUndefined()
  })

  it('creates a custom domain', () => {
    const domain = domainStore.create(POOL_ID, {
      Domain: 'auth.example.com',
      UserPoolId: POOL_ID,
      CustomDomainConfig: {
        CertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/abc-123',
      },
    })
    expect(domain.Domain).toBe('auth.example.com')
    expect(domain.Status).toBe('CREATING')
    expect(domain.CustomDomainConfig?.CertificateArn).toBe(
      'arn:aws:acm:us-east-1:123456789012:certificate/abc-123',
    )
    expect(domain.CloudFrontDistribution).toBeDefined()
  })

  it('rejects missing domain name', () => {
    expect(() => {
      domainStore.create(POOL_ID, { UserPoolId: POOL_ID })
    }).toThrow('Domain is required')
  })

  it('rejects duplicate domain name', () => {
    domainStore.create(POOL_ID, { Domain: 'dup', UserPoolId: POOL_ID })
    expect(() => {
      domainStore.create('other-pool', { Domain: 'dup', UserPoolId: 'other-pool' })
    }).toThrow()
  })

  it('rejects second domain for same pool', () => {
    domainStore.create(POOL_ID, { Domain: 'first', UserPoolId: POOL_ID })
    expect(() => {
      domainStore.create(POOL_ID, { Domain: 'second', UserPoolId: POOL_ID })
    }).toThrow('already associated')
  })

  it('describes an existing domain', () => {
    domainStore.create(POOL_ID, { Domain: 'test-domain', UserPoolId: POOL_ID })
    const domain = domainStore.describe('test-domain')
    expect(domain.Domain).toBe('test-domain')
    expect(domain.UserPoolId).toBe(POOL_ID)
  })

  it('returns empty object for missing domain', () => {
    const domain = domainStore.describe('nonexistent')
    expect(domain.Domain).toBeUndefined()
    expect(domain.UserPoolId).toBeUndefined()
  })

  it('updates a custom domain certificate', () => {
    domainStore.create(POOL_ID, {
      Domain: 'auth.example.com',
      UserPoolId: POOL_ID,
      CustomDomainConfig: {
        CertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/old',
      },
    })
    const updated = domainStore.update('auth.example.com', {
      CustomDomainConfig: {
        CertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/new',
      },
    })
    expect(updated.CustomDomainConfig?.CertificateArn).toBe(
      'arn:aws:acm:us-east-1:123456789012:certificate/new',
    )
    expect(updated.Status).toBe('ACTIVE')
  })

  it('throws on update of nonexistent domain', () => {
    expect(() => {
      domainStore.update('missing', { CustomDomainConfig: { CertificateArn: 'arn' } })
    }).toThrow()
  })

  it('deletes a domain', () => {
    domainStore.create(POOL_ID, { Domain: 'to-delete', UserPoolId: POOL_ID })
    domainStore.delete('to-delete', POOL_ID)
    const result = domainStore.describe('to-delete')
    expect(result.Domain).toBeUndefined()
  })

  it('throws on delete of nonexistent domain', () => {
    expect(() => {
      domainStore.delete('missing', POOL_ID)
    }).toThrow()
  })

  it('throws on delete with wrong pool ID', () => {
    domainStore.create(POOL_ID, { Domain: 'wrong-pool', UserPoolId: POOL_ID })
    expect(() => {
      domainStore.delete('wrong-pool', 'different-pool')
    }).toThrow('does not belong')
  })

  it('describes by user pool', () => {
    domainStore.create(POOL_ID, { Domain: 'pool-domain', UserPoolId: POOL_ID })
    const domain = domainStore.describeByUserPool(POOL_ID)
    expect(domain?.Domain).toBe('pool-domain')
  })

  it('returns undefined for pool with no domain', () => {
    const domain = domainStore.describeByUserPool('no-domain-pool')
    expect(domain).toBeUndefined()
  })

  it('sets ManagedLoginVersion', () => {
    const domain = domainStore.create(POOL_ID, {
      Domain: 'managed',
      UserPoolId: POOL_ID,
      ManagedLoginVersion: 2,
    })
    expect(domain.ManagedLoginVersion).toBe(2)
  })

  it('seeds demo data', () => {
    domainStore.seed(POOL_ID)
    const domain = domainStore.describeByUserPool(POOL_ID)
    expect(domain).toBeDefined()
    expect(domain?.Domain).toBe('my-app-auth')
  })
})
