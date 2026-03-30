/**
 * Placeholder for creating mock permission sets in tests.
 * Will be fully implemented when the PermissionProvider is built (TASK-005).
 */

/** Placeholder type — replaced by the real CognitoPermission union in TASK-005. */
type Permission = string

interface MockPermissions {
  permissions: Set<Permission>
  hasPermission: (p: Permission) => boolean
  hasAnyPermission: (ps: readonly Permission[]) => boolean
  hasAllPermissions: (ps: readonly Permission[]) => boolean
}

/**
 * Returns a mock permission context value for use in tests.
 * Pass specific permissions to restrict, or omit for "allow everything".
 */
export function createMockPermissions(
  granted?: readonly Permission[],
): MockPermissions {
  const permissions = new Set<Permission>(granted ?? [])
  return {
    permissions,
    hasPermission: (p) => permissions.has(p),
    hasAnyPermission: (ps) => ps.some((p) => permissions.has(p)),
    hasAllPermissions: (ps) => ps.every((p) => permissions.has(p)),
  }
}
