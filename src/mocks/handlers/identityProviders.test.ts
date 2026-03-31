import { describe, it, expect, beforeEach } from 'vitest'
import {
  CreateIdentityProviderCommand,
  DescribeIdentityProviderCommand,
  UpdateIdentityProviderCommand,
  DeleteIdentityProviderCommand,
  ListIdentityProvidersCommand,
  GetIdentityProviderByIdentifierCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../../api/client'
import { identityProviderStore } from '../stores/identityProviderStore'

const POOL_ID = 'us-east-1_HandlerTest'

describe('Identity Provider MSW Handlers', () => {
  beforeEach(() => {
    identityProviderStore.clear()
  })

  it('CreateIdentityProvider creates a new provider', async () => {
    const result = await cognitoClient.send(
      new CreateIdentityProviderCommand({
        UserPoolId: POOL_ID,
        ProviderName: 'TestOIDC',
        ProviderType: 'OIDC',
        ProviderDetails: {
          client_id: 'test-id',
          oidc_issuer: 'https://auth.example.com',
          authorize_scopes: 'openid email',
        },
        AttributeMapping: { email: 'email' },
      }),
    )
    expect(result.IdentityProvider?.ProviderName).toBe('TestOIDC')
    expect(result.IdentityProvider?.ProviderType).toBe('OIDC')
    expect(result.IdentityProvider?.ProviderDetails?.client_id).toBe('test-id')
  })

  it('DescribeIdentityProvider retrieves a provider', async () => {
    identityProviderStore.create(POOL_ID, {
      ProviderName: 'Fetch',
      ProviderType: 'SAML',
      ProviderDetails: { MetadataURL: 'https://example.com/meta' },
    })
    const result = await cognitoClient.send(
      new DescribeIdentityProviderCommand({ UserPoolId: POOL_ID, ProviderName: 'Fetch' }),
    )
    expect(result.IdentityProvider?.ProviderName).toBe('Fetch')
    expect(result.IdentityProvider?.ProviderType).toBe('SAML')
  })

  it('UpdateIdentityProvider updates provider fields', async () => {
    identityProviderStore.create(POOL_ID, {
      ProviderName: 'Upd',
      ProviderType: 'OIDC',
      ProviderDetails: { client_id: 'old' },
    })
    const result = await cognitoClient.send(
      new UpdateIdentityProviderCommand({
        UserPoolId: POOL_ID,
        ProviderName: 'Upd',
        ProviderDetails: { client_id: 'new-id', oidc_issuer: 'https://new.example.com' },
        AttributeMapping: { name: 'full_name' },
      }),
    )
    expect(result.IdentityProvider?.ProviderDetails?.client_id).toBe('new-id')
    expect(result.IdentityProvider?.AttributeMapping?.name).toBe('full_name')
  })

  it('DeleteIdentityProvider removes a provider', async () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'ToDelete', ProviderType: 'OIDC' })
    await cognitoClient.send(
      new DeleteIdentityProviderCommand({ UserPoolId: POOL_ID, ProviderName: 'ToDelete' }),
    )
    await expect(
      cognitoClient.send(new DescribeIdentityProviderCommand({ UserPoolId: POOL_ID, ProviderName: 'ToDelete' })),
    ).rejects.toThrow()
  })

  it('ListIdentityProviders returns providers for pool', async () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'P1', ProviderType: 'OIDC' })
    identityProviderStore.create(POOL_ID, { ProviderName: 'P2', ProviderType: 'SAML' })
    identityProviderStore.create(POOL_ID, { ProviderName: 'P3', ProviderType: 'Google' })
    const result = await cognitoClient.send(
      new ListIdentityProvidersCommand({ UserPoolId: POOL_ID, MaxResults: 60 }),
    )
    expect(result.Providers).toHaveLength(3)
  })

  it('ListIdentityProviders paginates', async () => {
    for (let i = 0; i < 5; i++) {
      identityProviderStore.create(POOL_ID, { ProviderName: `Pg${String(i)}`, ProviderType: 'OIDC' })
    }
    const page1 = await cognitoClient.send(
      new ListIdentityProvidersCommand({ UserPoolId: POOL_ID, MaxResults: 2 }),
    )
    expect(page1.Providers).toHaveLength(2)
    expect(page1.NextToken).toBeDefined()

    const page2 = await cognitoClient.send(
      new ListIdentityProvidersCommand({ UserPoolId: POOL_ID, MaxResults: 2, NextToken: page1.NextToken }),
    )
    expect(page2.Providers).toHaveLength(2)
  })

  it('GetIdentityProviderByIdentifier finds by identifier', async () => {
    identityProviderStore.create(POOL_ID, {
      ProviderName: 'WithId',
      ProviderType: 'OIDC',
      IdpIdentifiers: ['my-identifier'],
    })
    const result = await cognitoClient.send(
      new GetIdentityProviderByIdentifierCommand({ UserPoolId: POOL_ID, IdpIdentifier: 'my-identifier' }),
    )
    expect(result.IdentityProvider?.ProviderName).toBe('WithId')
  })

  it('CreateIdentityProvider rejects duplicate name', async () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'Dup', ProviderType: 'OIDC' })
    await expect(
      cognitoClient.send(
        new CreateIdentityProviderCommand({
          UserPoolId: POOL_ID,
          ProviderName: 'Dup',
          ProviderType: 'OIDC',
          ProviderDetails: { client_id: 'dup' },
        }),
      ),
    ).rejects.toThrow()
  })

  it('DescribeIdentityProvider rejects missing provider', async () => {
    await expect(
      cognitoClient.send(
        new DescribeIdentityProviderCommand({ UserPoolId: POOL_ID, ProviderName: 'Missing' }),
      ),
    ).rejects.toThrow()
  })
})
