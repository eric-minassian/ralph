import type { GroupType } from '@aws-sdk/client-cognito-identity-provider'

let counter = 0

function nextName(): string {
  counter += 1
  return `TestGroup${String(counter).padStart(3, '0')}`
}

/**
 * Creates a realistic mock GroupType.
 */
export function createMockGroup(
  userPoolId: string,
  overrides: Partial<GroupType> = {},
): GroupType {
  const groupName = overrides.GroupName ?? nextName()
  const now = new Date()
  return {
    GroupName: groupName,
    UserPoolId: userPoolId,
    Description: `Description for ${groupName}`,
    Precedence: 10,
    CreationDate: now,
    LastModifiedDate: now,
    ...overrides,
  }
}

/**
 * Resets the counter — call in test teardown if needed.
 */
export function resetGroupCounter(): void {
  counter = 0
}
