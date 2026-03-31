import type { UserPoolClientType } from '@aws-sdk/client-cognito-identity-provider'

let counter = 0

function nextName(): string {
  counter += 1
  return `TestClient${String(counter).padStart(3, '0')}`
}

export function createMockAppClient(
  userPoolId: string,
  overrides: Partial<UserPoolClientType> = {},
): UserPoolClientType {
  const clientName = overrides.ClientName ?? nextName()
  const now = new Date()
  return {
    ClientName: clientName,
    ClientId: overrides.ClientId ?? `client-${String(Date.now())}-${String(counter)}`,
    UserPoolId: userPoolId,
    CreationDate: now,
    LastModifiedDate: now,
    ExplicitAuthFlows: ['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'],
    AccessTokenValidity: 1,
    IdTokenValidity: 1,
    RefreshTokenValidity: 30,
    TokenValidityUnits: {
      AccessToken: 'hours',
      IdToken: 'hours',
      RefreshToken: 'days',
    },
    EnableTokenRevocation: true,
    ...overrides,
  }
}

export function resetAppClientCounter(): void {
  counter = 0
}
