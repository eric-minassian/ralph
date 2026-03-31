import type { IdentityProviderType } from '@aws-sdk/client-cognito-identity-provider'

let counter = 0

function nextName(): string {
  counter += 1
  return `TestProvider${String(counter).padStart(3, '0')}`
}

/**
 * Creates a realistic mock IdentityProviderType.
 */
export function createMockIdentityProvider(
  userPoolId: string,
  overrides: Partial<IdentityProviderType> = {},
): IdentityProviderType {
  const providerName = overrides.ProviderName ?? nextName()
  const now = new Date()
  return {
    ProviderName: providerName,
    ProviderType: 'OIDC',
    UserPoolId: userPoolId,
    ProviderDetails: {
      client_id: 'mock-client-id',
      client_secret: 'mock-client-secret',
      oidc_issuer: 'https://auth.example.com/',
      authorize_scopes: 'openid email profile',
      attributes_request_method: 'GET',
    },
    AttributeMapping: {
      email: 'email',
      username: 'sub',
    },
    IdpIdentifiers: [],
    CreationDate: now,
    LastModifiedDate: now,
    ...overrides,
  }
}

/**
 * Resets the counter — call in test teardown if needed.
 */
export function resetIdentityProviderCounter(): void {
  counter = 0
}
