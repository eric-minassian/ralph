import type { UserPoolDescriptionType, UserPoolType } from '@aws-sdk/client-cognito-identity-provider'

let counter = 0

function nextId(): string {
  counter += 1
  return `us-east-1_TestPool${String(counter).padStart(3, '0')}`
}

/**
 * Creates a realistic mock UserPoolDescriptionType (list item).
 */
export function createMockUserPoolDescription(
  overrides: Partial<UserPoolDescriptionType> = {},
): UserPoolDescriptionType {
  const id = overrides.Id ?? nextId()
  const now = new Date()
  return {
    Id: id,
    Name: `TestPool-${id}`,
    CreationDate: now,
    LastModifiedDate: now,
    ...overrides,
  }
}

/**
 * Creates a realistic mock UserPoolType (full detail).
 */
export function createMockUserPool(
  overrides: Partial<UserPoolType> = {},
): UserPoolType {
  const id = overrides.Id ?? nextId()
  const now = new Date()
  return {
    Id: id,
    Name: `TestPool-${id}`,
    CreationDate: now,
    LastModifiedDate: now,
    Policies: {
      PasswordPolicy: {
        MinimumLength: 8,
        RequireUppercase: true,
        RequireLowercase: true,
        RequireNumbers: true,
        RequireSymbols: true,
        TemporaryPasswordValidityDays: 7,
      },
    },
    DeletionProtection: 'ACTIVE',
    MfaConfiguration: 'OFF',
    SchemaAttributes: [
      { Name: 'sub', AttributeDataType: 'String', Mutable: false, Required: true },
      { Name: 'email', AttributeDataType: 'String', Mutable: true, Required: true },
      { Name: 'name', AttributeDataType: 'String', Mutable: true, Required: false },
    ],
    AutoVerifiedAttributes: ['email'],
    EstimatedNumberOfUsers: 0,
    ...overrides,
  }
}

/**
 * Resets the counter — call in test teardown if needed.
 */
export function resetUserPoolCounter(): void {
  counter = 0
}
