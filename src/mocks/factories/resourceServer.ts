import type { ResourceServerType } from '@aws-sdk/client-cognito-identity-provider'

let counter = 0

function nextName(): string {
  counter += 1
  return `TestResourceServer${String(counter).padStart(3, '0')}`
}

/**
 * Creates a realistic mock ResourceServerType.
 */
export function createMockResourceServer(
  userPoolId: string,
  overrides: Partial<ResourceServerType> = {},
): ResourceServerType {
  const name = overrides.Name ?? nextName()
  const identifier = overrides.Identifier ?? `https://${name.toLowerCase().replace(/\s+/g, '-')}.example.com`
  return {
    UserPoolId: userPoolId,
    Identifier: identifier,
    Name: name,
    Scopes: [
      { ScopeName: 'read', ScopeDescription: 'Read access' },
      { ScopeName: 'write', ScopeDescription: 'Write access' },
    ],
    ...overrides,
  }
}

/**
 * Resets the counter — call in test teardown if needed.
 */
export function resetResourceServerCounter(): void {
  counter = 0
}
