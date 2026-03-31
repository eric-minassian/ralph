import type {
  IdentityProviderType,
  ProviderDescription,
  IdentityProviderTypeType,
} from '@aws-sdk/client-cognito-identity-provider'
import { BaseStore, StoreError } from './baseStore'

// ── Type guard helpers ───────────────────────────────────────────────

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const VALID_PROVIDER_TYPES = new Set<string>([
  'SAML', 'OIDC', 'Facebook', 'Google', 'LoginWithAmazon', 'SignInWithApple',
])

function isProviderType(value: string): value is IdentityProviderTypeType {
  return VALID_PROVIDER_TYPES.has(value)
}

function toStringRecord(obj: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (isString(value)) {
      result[key] = value
    }
  }
  return result
}

// ── Store helpers ────────────────────────────────────────────────────

function compositeKey(userPoolId: string, providerName: string): string {
  return `${userPoolId}#${providerName}`
}

function getProviderKey(provider: IdentityProviderType): string {
  return compositeKey(provider.UserPoolId ?? '', provider.ProviderName ?? '')
}

// ── Main store ──────────────────────────────────────────────────────

class IdentityProviderStore {
  private readonly store = new BaseStore<IdentityProviderType>(getProviderKey)

  create(userPoolId: string, input: Record<string, unknown>): IdentityProviderType {
    const providerName = input.ProviderName
    if (!isString(providerName) || providerName.trim().length === 0) {
      throw new StoreError('InvalidParameterException', 'ProviderName is required')
    }

    const providerType = input.ProviderType
    if (!isString(providerType) || !isProviderType(providerType)) {
      throw new StoreError('InvalidParameterException', 'ProviderType is required and must be valid')
    }

    const now = new Date()
    const provider: IdentityProviderType = {
      ProviderName: providerName.trim(),
      ProviderType: providerType,
      UserPoolId: userPoolId,
      CreationDate: now,
      LastModifiedDate: now,
    }

    if (isRecord(input.ProviderDetails)) {
      provider.ProviderDetails = toStringRecord(input.ProviderDetails)
    }

    if (isRecord(input.AttributeMapping)) {
      provider.AttributeMapping = toStringRecord(input.AttributeMapping)
    }

    if (isStringArray(input.IdpIdentifiers)) {
      provider.IdpIdentifiers = input.IdpIdentifiers
    }

    this.store.create(provider)
    return provider
  }

  describe(userPoolId: string, providerName: string): IdentityProviderType {
    return this.store.get(compositeKey(userPoolId, providerName))
  }

  describeByIdentifier(userPoolId: string, identifier: string): IdentityProviderType {
    const all = this.store.list().filter((p) => p.UserPoolId === userPoolId)
    const match = all.find((p) =>
      p.IdpIdentifiers?.includes(identifier) ?? false,
    )
    if (!match) {
      throw new StoreError(
        'ResourceNotFoundException',
        `Identity provider with identifier '${identifier}' not found`,
      )
    }
    return match
  }

  update(userPoolId: string, providerName: string, input: Record<string, unknown>): IdentityProviderType {
    const key = compositeKey(userPoolId, providerName)
    return this.store.update(key, (existing) => {
      const updated: IdentityProviderType = { ...existing, LastModifiedDate: new Date() }

      if (isRecord(input.ProviderDetails)) {
        updated.ProviderDetails = toStringRecord(input.ProviderDetails)
      }

      if (isRecord(input.AttributeMapping)) {
        updated.AttributeMapping = toStringRecord(input.AttributeMapping)
      }

      if (isStringArray(input.IdpIdentifiers)) {
        updated.IdpIdentifiers = input.IdpIdentifiers
      }

      return updated
    })
  }

  delete(userPoolId: string, providerName: string): void {
    this.store.delete(compositeKey(userPoolId, providerName))
  }

  list(
    userPoolId: string,
    maxResults: number,
    nextToken?: string,
  ): { Providers: ProviderDescription[]; NextToken: string | undefined } {
    const allProviders = this.store
      .list()
      .filter((p) => p.UserPoolId === userPoolId)
    const startIndex = nextToken ? parseInt(nextToken, 10) : 0
    const endIndex = startIndex + maxResults
    const pageItems = allProviders.slice(startIndex, endIndex)
    const newNextToken =
      endIndex < allProviders.length ? String(endIndex) : undefined

    const descriptions: ProviderDescription[] = pageItems.map((p) => ({
      ProviderName: p.ProviderName,
      ProviderType: p.ProviderType,
      LastModifiedDate: p.LastModifiedDate,
      CreationDate: p.CreationDate,
    }))

    return { Providers: descriptions, NextToken: newNextToken }
  }

  clear(): void {
    this.store.clear()
  }

  seed(userPoolId: string): void {
    this.create(userPoolId, {
      ProviderName: 'OktaSAML',
      ProviderType: 'SAML',
      ProviderDetails: {
        MetadataURL: 'https://dev-123456.okta.com/app/abc123/sso/saml/metadata',
        IDPSignout: 'true',
        IDPInit: 'false',
        RequestSigningAlgorithm: 'rsa-sha256',
      },
      AttributeMapping: {
        email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
        name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
      },
      IdpIdentifiers: ['okta-saml'],
    })

    this.create(userPoolId, {
      ProviderName: 'Auth0OIDC',
      ProviderType: 'OIDC',
      ProviderDetails: {
        client_id: 'abc123def456',
        client_secret: 'oidc-client-secret',
        oidc_issuer: 'https://dev-example.us.auth0.com/',
        authorize_scopes: 'openid email profile',
        attributes_request_method: 'GET',
      },
      AttributeMapping: {
        email: 'email',
        username: 'sub',
        name: 'name',
      },
      IdpIdentifiers: ['auth0-oidc'],
    })

    this.create(userPoolId, {
      ProviderName: 'GoogleIdP',
      ProviderType: 'Google',
      ProviderDetails: {
        client_id: '123456789.apps.googleusercontent.com',
        client_secret: 'google-secret',
        authorize_scopes: 'openid email profile',
      },
      AttributeMapping: {
        email: 'email',
        username: 'sub',
        name: 'name',
        picture: 'picture',
      },
    })
  }
}

export const identityProviderStore = new IdentityProviderStore()
