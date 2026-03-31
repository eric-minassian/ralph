import { describe, it, expect, beforeEach } from 'vitest'
import { appClientStore } from './appClientStore'

const POOL_ID = 'us-east-1_TestPool'

describe('AppClientStore', () => {
  beforeEach(() => {
    appClientStore.clear()
  })

  describe('create', () => {
    it('creates a client with required fields', () => {
      const client = appClientStore.create(POOL_ID, { ClientName: 'WebApp' })
      expect(client.ClientName).toBe('WebApp')
      expect(client.UserPoolId).toBe(POOL_ID)
      expect(client.ClientId).toBeDefined()
      expect(client.CreationDate).toBeInstanceOf(Date)
      expect(client.LastModifiedDate).toBeInstanceOf(Date)
    })

    it('creates a client with auth flows', () => {
      const client = appClientStore.create(POOL_ID, {
        ClientName: 'TestClient',
        ExplicitAuthFlows: ['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'],
      })
      expect(client.ExplicitAuthFlows).toEqual(['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'])
    })

    it('creates a client with OAuth settings', () => {
      const client = appClientStore.create(POOL_ID, {
        ClientName: 'OAuthClient',
        AllowedOAuthFlows: ['code', 'implicit'],
        AllowedOAuthScopes: ['openid', 'email'],
        AllowedOAuthFlowsUserPoolClient: true,
        CallbackURLs: ['https://example.com/cb'],
        LogoutURLs: ['https://example.com/logout'],
      })
      expect(client.AllowedOAuthFlows).toEqual(['code', 'implicit'])
      expect(client.AllowedOAuthScopes).toEqual(['openid', 'email'])
      expect(client.AllowedOAuthFlowsUserPoolClient).toBe(true)
      expect(client.CallbackURLs).toEqual(['https://example.com/cb'])
      expect(client.LogoutURLs).toEqual(['https://example.com/logout'])
    })

    it('creates a client with token validity settings', () => {
      const client = appClientStore.create(POOL_ID, {
        ClientName: 'TokenClient',
        AccessTokenValidity: 1,
        IdTokenValidity: 1,
        RefreshTokenValidity: 30,
        TokenValidityUnits: {
          AccessToken: 'hours',
          IdToken: 'hours',
          RefreshToken: 'days',
        },
      })
      expect(client.AccessTokenValidity).toBe(1)
      expect(client.IdTokenValidity).toBe(1)
      expect(client.RefreshTokenValidity).toBe(30)
      expect(client.TokenValidityUnits?.AccessToken).toBe('hours')
      expect(client.TokenValidityUnits?.IdToken).toBe('hours')
      expect(client.TokenValidityUnits?.RefreshToken).toBe('days')
    })

    it('generates a client secret when requested', () => {
      const client = appClientStore.create(POOL_ID, {
        ClientName: 'SecretClient',
        GenerateSecret: true,
      })
      expect(client.ClientSecret).toBeDefined()
      expect(typeof client.ClientSecret).toBe('string')
    })

    it('does not generate a secret by default', () => {
      const client = appClientStore.create(POOL_ID, { ClientName: 'NoSecret' })
      expect(client.ClientSecret).toBeUndefined()
    })

    it('sets prevent user existence errors', () => {
      const client = appClientStore.create(POOL_ID, {
        ClientName: 'PrevErr',
        PreventUserExistenceErrors: true,
      })
      expect(client.PreventUserExistenceErrors).toBe('ENABLED')
    })

    it('throws on missing ClientName', () => {
      expect(() => appClientStore.create(POOL_ID, {})).toThrow('ClientName is required')
    })

    it('throws on empty ClientName', () => {
      expect(() => appClientStore.create(POOL_ID, { ClientName: '  ' })).toThrow('ClientName is required')
    })
  })

  describe('describe', () => {
    it('returns the client', () => {
      const created = appClientStore.create(POOL_ID, { ClientName: 'Desc' })
      const client = appClientStore.describe(POOL_ID, created.ClientId ?? '')
      expect(client.ClientName).toBe('Desc')
    })

    it('throws on not found', () => {
      expect(() => appClientStore.describe(POOL_ID, 'nonexistent')).toThrow('not found')
    })
  })

  describe('update', () => {
    it('updates client name and auth flows', () => {
      const created = appClientStore.create(POOL_ID, {
        ClientName: 'Original',
        ExplicitAuthFlows: ['ALLOW_USER_SRP_AUTH'],
      })
      const clientId = created.ClientId ?? ''
      const updated = appClientStore.update(POOL_ID, clientId, {
        ClientName: 'Updated',
        ExplicitAuthFlows: ['ALLOW_USER_SRP_AUTH', 'ALLOW_CUSTOM_AUTH'],
      })
      expect(updated.ClientName).toBe('Updated')
      expect(updated.ExplicitAuthFlows).toEqual(['ALLOW_USER_SRP_AUTH', 'ALLOW_CUSTOM_AUTH'])
    })

    it('throws on not found', () => {
      expect(() => appClientStore.update(POOL_ID, 'nonexistent', { ClientName: 'X' })).toThrow('not found')
    })
  })

  describe('delete', () => {
    it('deletes a client', () => {
      const created = appClientStore.create(POOL_ID, { ClientName: 'ToDelete' })
      const clientId = created.ClientId ?? ''
      appClientStore.delete(POOL_ID, clientId)
      expect(() => appClientStore.describe(POOL_ID, clientId)).toThrow('not found')
    })

    it('throws on not found', () => {
      expect(() => appClientStore.delete(POOL_ID, 'nonexistent')).toThrow('not found')
    })
  })

  describe('list', () => {
    it('lists clients for a pool', () => {
      appClientStore.create(POOL_ID, { ClientName: 'Client1' })
      appClientStore.create(POOL_ID, { ClientName: 'Client2' })
      appClientStore.create('us-east-1_Other', { ClientName: 'OtherClient' })

      const result = appClientStore.list(POOL_ID, 20)
      expect(result.UserPoolClients).toHaveLength(2)
      expect(result.NextToken).toBeUndefined()
    })

    it('paginates clients', () => {
      for (let i = 0; i < 5; i++) {
        appClientStore.create(POOL_ID, { ClientName: `Client${String(i)}` })
      }

      const page1 = appClientStore.list(POOL_ID, 2)
      expect(page1.UserPoolClients).toHaveLength(2)
      expect(page1.NextToken).toBe('2')

      const page2 = appClientStore.list(POOL_ID, 2, page1.NextToken)
      expect(page2.UserPoolClients).toHaveLength(2)
      expect(page2.NextToken).toBe('4')

      const page3 = appClientStore.list(POOL_ID, 2, page2.NextToken)
      expect(page3.UserPoolClients).toHaveLength(1)
      expect(page3.NextToken).toBeUndefined()
    })

    it('returns description format with ClientId, ClientName, UserPoolId', () => {
      appClientStore.create(POOL_ID, { ClientName: 'Desc' })
      const result = appClientStore.list(POOL_ID, 20)
      const desc = result.UserPoolClients[0]
      expect(desc?.ClientId).toBeDefined()
      expect(desc?.ClientName).toBe('Desc')
      expect(desc?.UserPoolId).toBe(POOL_ID)
    })
  })

  describe('secrets', () => {
    it('adds a secret to a client', () => {
      const created = appClientStore.create(POOL_ID, { ClientName: 'SecretClient' })
      const clientId = created.ClientId ?? ''
      const secret = appClientStore.addSecret(POOL_ID, clientId)
      expect(secret.ClientSecretId).toBeDefined()
      expect(secret.ClientSecretValue).toBeDefined()
      expect(secret.ClientSecretCreateDate).toBeInstanceOf(Date)
    })

    it('lists secrets for a client', () => {
      const created = appClientStore.create(POOL_ID, { ClientName: 'Multi' })
      const clientId = created.ClientId ?? ''
      appClientStore.addSecret(POOL_ID, clientId)
      appClientStore.addSecret(POOL_ID, clientId)
      const result = appClientStore.listSecrets(POOL_ID, clientId)
      expect(result.ClientSecrets).toHaveLength(2)
    })

    it('deletes a secret', () => {
      const created = appClientStore.create(POOL_ID, { ClientName: 'DelSecret' })
      const clientId = created.ClientId ?? ''
      const secret = appClientStore.addSecret(POOL_ID, clientId)
      appClientStore.deleteSecret(POOL_ID, clientId, secret.ClientSecretId)
      const result = appClientStore.listSecrets(POOL_ID, clientId)
      expect(result.ClientSecrets).toHaveLength(0)
    })

    it('throws when deleting nonexistent secret', () => {
      const created = appClientStore.create(POOL_ID, { ClientName: 'NoSecret' })
      const clientId = created.ClientId ?? ''
      expect(() => appClientStore.deleteSecret(POOL_ID, clientId, 'nonexistent')).toThrow('not found')
    })

    it('lists empty secrets for new client', () => {
      const created = appClientStore.create(POOL_ID, { ClientName: 'Empty' })
      const clientId = created.ClientId ?? ''
      const result = appClientStore.listSecrets(POOL_ID, clientId)
      expect(result.ClientSecrets).toHaveLength(0)
    })
  })

  describe('seed', () => {
    it('seeds default clients', () => {
      appClientStore.seed(POOL_ID)
      const result = appClientStore.list(POOL_ID, 20)
      expect(result.UserPoolClients).toHaveLength(3)
      const names = result.UserPoolClients.map((c) => c.ClientName)
      expect(names).toContain('WebApp')
      expect(names).toContain('BackendService')
      expect(names).toContain('MobileApp')
    })
  })
})
