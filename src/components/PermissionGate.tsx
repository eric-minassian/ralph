import type { ReactNode } from 'react'
import { usePermissions } from '../hooks/usePermissions'
import type { CognitoPermission } from '../types/permissions'

type PermissionGateProps = {
  children: ReactNode
  fallback?: ReactNode
} & (
  | { permission: CognitoPermission; anyOf?: never; allOf?: never }
  | { permission?: never; anyOf: readonly CognitoPermission[]; allOf?: never }
  | { permission?: never; anyOf?: never; allOf: readonly CognitoPermission[] }
)

export function PermissionGate({
  children,
  fallback,
  permission,
  anyOf,
  allOf,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissions()

  let allowed = false

  if (permission !== undefined) {
    allowed = hasPermission(permission)
  } else if (anyOf !== undefined) {
    allowed = hasAnyPermission(anyOf)
  } else {
    allowed = hasAllPermissions(allOf)
  }

  if (!allowed) {
    return fallback ?? null
  }

  return children
}
