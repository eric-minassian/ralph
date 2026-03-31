import { useMemo, type ReactNode } from 'react'
import type { CognitoPermission } from '../types/permissions'
import {
  PermissionContext,
  type PermissionContextValue,
} from './permissionContext'

interface PermissionProviderProps {
  children: ReactNode
  permissions: Set<CognitoPermission>
}

export function PermissionProvider({
  children,
  permissions,
}: PermissionProviderProps) {
  const value = useMemo<PermissionContextValue>(
    () => ({
      permissions,
      hasPermission: (p) => permissions.has(p),
      hasAnyPermission: (ps) => ps.some((p) => permissions.has(p)),
      hasAllPermissions: (ps) => ps.every((p) => permissions.has(p)),
    }),
    [permissions],
  )

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}
