import type { UserType, AttributeType } from '@aws-sdk/client-cognito-identity-provider'

let counter = 0

function nextUsername(): string {
  counter += 1
  return `testuser${String(counter).padStart(3, '0')}`
}

function findAttribute(attributes: readonly AttributeType[], name: string): string | undefined {
  const attr = attributes.find((a) => a.Name === name)
  return attr?.Value
}

/**
 * Creates a realistic mock UserType for admin user operations.
 */
export function createMockUser(
  userPoolId: string,
  overrides: Partial<UserType> & { Attributes?: AttributeType[] } = {},
): UserType {
  const username = overrides.Username ?? nextUsername()
  const now = new Date()
  const defaultAttributes: AttributeType[] = [
    { Name: 'sub', Value: crypto.randomUUID() },
    { Name: 'email', Value: `${username}@example.com` },
    { Name: 'email_verified', Value: 'true' },
  ]
  const attributes = overrides.Attributes ?? defaultAttributes

  return {
    Username: username,
    Attributes: attributes,
    UserCreateDate: overrides.UserCreateDate ?? now,
    UserLastModifiedDate: overrides.UserLastModifiedDate ?? now,
    Enabled: overrides.Enabled ?? true,
    UserStatus: overrides.UserStatus ?? 'CONFIRMED',
    MFAOptions: overrides.MFAOptions,
  }
}

/**
 * Creates a summary object similar to what ListUsers returns.
 */
export function createMockUserForList(
  userPoolId: string,
  overrides: Partial<UserType> & { Attributes?: AttributeType[] } = {},
): UserType {
  return createMockUser(userPoolId, overrides)
}

/**
 * Extracts email from user attributes.
 */
export function getUserEmail(user: UserType): string | undefined {
  return findAttribute(user.Attributes ?? [], 'email')
}

/**
 * Extracts phone number from user attributes.
 */
export function getUserPhone(user: UserType): string | undefined {
  return findAttribute(user.Attributes ?? [], 'phone_number')
}

/**
 * Resets the counter — call in test teardown if needed.
 */
export function resetUserCounter(): void {
  counter = 0
}
