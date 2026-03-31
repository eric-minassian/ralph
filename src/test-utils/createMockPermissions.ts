import type { CognitoPermission } from '../types/permissions'
import { ALL_COGNITO_PERMISSIONS } from '../types/permissions'
import type { PermissionContextValue } from '../contexts/permissionContext'

/**
 * Returns a mock permission context value for use in tests.
 * Pass specific permissions to restrict, or omit for "allow everything".
 */
export function createMockPermissions(
  granted?: readonly CognitoPermission[],
): PermissionContextValue {
  const permissions = new Set<CognitoPermission>(
    granted ?? ALL_COGNITO_PERMISSIONS,
  )
  return {
    permissions,
    hasPermission: (p) => permissions.has(p),
    hasAnyPermission: (ps) => ps.some((p) => permissions.has(p)),
    hasAllPermissions: (ps) => ps.every((p) => permissions.has(p)),
  }
}
