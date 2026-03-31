import { describe, it, expect, beforeEach } from 'vitest'
import { identityProviderStore } from './identityProviderStore'

const POOL_ID = 'us-east-1_StoreTest'

describe('IdentityProviderStore', () => {
  beforeEach(() => {
    identityProviderStore.clear()
  })

  it('creates a provider', () => {
    const provider = identityProviderStore.create(POOL_ID, {
      ProviderName: 'TestOIDC',
      ProviderType: 'OIDC',
      ProviderDetails: { client_id: 'abc', oidc_issuer: 'https://example.com' },
    })
    expect(provider.ProviderName).toBe('TestOIDC')
    expect(provider.ProviderType).toBe('OIDC')
    expect(provider.UserPoolId).toBe(POOL_ID)
    expect(provider.ProviderDetails?.client_id).toBe('abc')
    expect(provider.CreationDate).toBeInstanceOf(Date)
  })

  it('creates a SAML provider', () => {
    const provider = identityProviderStore.create(POOL_ID, {
      ProviderName: 'TestSAML',
      ProviderType: 'SAML',
      ProviderDetails: { MetadataURL: 'https://idp.example.com/metadata' },
      AttributeMapping: { email: 'emailAddress' },
    })
    expect(provider.ProviderType).toBe('SAML')
    expect(provider.ProviderDetails?.MetadataURL).toBe('https://idp.example.com/metadata')
    expect(provider.AttributeMapping?.email).toBe('emailAddress')
  })

  it('creates a social provider', () => {
    const provider = identityProviderStore.create(POOL_ID, {
      ProviderName: 'GoogleTest',
      ProviderType: 'Google',
      ProviderDetails: { client_id: 'google-id', authorize_scopes: 'openid email' },
    })
    expect(provider.ProviderType).toBe('Google')
  })

  it('rejects duplicate provider name', () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'Dup', ProviderType: 'OIDC' })
    expect(() => {
      identityProviderStore.create(POOL_ID, { ProviderName: 'Dup', ProviderType: 'OIDC' })
    }).toThrow()
  })

  it('rejects missing provider name', () => {
    expect(() => {
      identityProviderStore.create(POOL_ID, { ProviderType: 'OIDC' })
    }).toThrow('ProviderName is required')
  })

  it('rejects invalid provider type', () => {
    expect(() => {
      identityProviderStore.create(POOL_ID, { ProviderName: 'Bad', ProviderType: 'invalid' })
    }).toThrow('ProviderType is required')
  })

  it('describes a provider', () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'Fetch', ProviderType: 'OIDC' })
    const provider = identityProviderStore.describe(POOL_ID, 'Fetch')
    expect(provider.ProviderName).toBe('Fetch')
  })

  it('throws on describe of missing provider', () => {
    expect(() => {
      identityProviderStore.describe(POOL_ID, 'Missing')
    }).toThrow()
  })

  it('updates a provider', () => {
    identityProviderStore.create(POOL_ID, {
      ProviderName: 'Upd',
      ProviderType: 'OIDC',
      ProviderDetails: { client_id: 'old' },
    })
    const updated = identityProviderStore.update(POOL_ID, 'Upd', {
      ProviderDetails: { client_id: 'new' },
      AttributeMapping: { email: 'email_attr' },
    })
    expect(updated.ProviderDetails?.client_id).toBe('new')
    expect(updated.AttributeMapping?.email).toBe('email_attr')
  })

  it('updates IdpIdentifiers', () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'WithId', ProviderType: 'OIDC' })
    const updated = identityProviderStore.update(POOL_ID, 'WithId', {
      IdpIdentifiers: ['id-1', 'id-2'],
    })
    expect(updated.IdpIdentifiers).toEqual(['id-1', 'id-2'])
  })

  it('deletes a provider', () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'Del', ProviderType: 'OIDC' })
    identityProviderStore.delete(POOL_ID, 'Del')
    expect(() => {
      identityProviderStore.describe(POOL_ID, 'Del')
    }).toThrow()
  })

  it('lists providers for a pool', () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'P1', ProviderType: 'OIDC' })
    identityProviderStore.create(POOL_ID, { ProviderName: 'P2', ProviderType: 'SAML' })
    identityProviderStore.create('other-pool', { ProviderName: 'P3', ProviderType: 'Google' })
    const result = identityProviderStore.list(POOL_ID, 20)
    expect(result.Providers).toHaveLength(2)
    expect(result.NextToken).toBeUndefined()
  })

  it('paginates list results', () => {
    for (let i = 0; i < 5; i++) {
      identityProviderStore.create(POOL_ID, { ProviderName: `Page${String(i)}`, ProviderType: 'OIDC' })
    }
    const page1 = identityProviderStore.list(POOL_ID, 2)
    expect(page1.Providers).toHaveLength(2)
    expect(page1.NextToken).toBe('2')

    const page2 = identityProviderStore.list(POOL_ID, 2, page1.NextToken)
    expect(page2.Providers).toHaveLength(2)
    expect(page2.NextToken).toBe('4')

    const page3 = identityProviderStore.list(POOL_ID, 2, page2.NextToken)
    expect(page3.Providers).toHaveLength(1)
    expect(page3.NextToken).toBeUndefined()
  })

  it('describes by identifier', () => {
    identityProviderStore.create(POOL_ID, {
      ProviderName: 'WithIds',
      ProviderType: 'OIDC',
      IdpIdentifiers: ['my-id', 'other-id'],
    })
    const provider = identityProviderStore.describeByIdentifier(POOL_ID, 'my-id')
    expect(provider.ProviderName).toBe('WithIds')
  })

  it('throws on missing identifier', () => {
    expect(() => {
      identityProviderStore.describeByIdentifier(POOL_ID, 'nonexistent')
    }).toThrow()
  })

  it('seeds demo data', () => {
    identityProviderStore.seed(POOL_ID)
    const result = identityProviderStore.list(POOL_ID, 60)
    expect(result.Providers.length).toBeGreaterThanOrEqual(3)
  })

  it('list returns ProviderDescription shape', () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'Shape', ProviderType: 'OIDC' })
    const result = identityProviderStore.list(POOL_ID, 20)
    const desc = result.Providers[0]
    expect(desc).toBeDefined()
    if (desc) {
      expect(desc.ProviderName).toBe('Shape')
      expect(desc.ProviderType).toBe('OIDC')
      expect(desc.CreationDate).toBeInstanceOf(Date)
      expect(desc.LastModifiedDate).toBeInstanceOf(Date)
    }
  })
})
