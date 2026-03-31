import { createContext } from 'react'
import type { CognitoPermission } from '../types/permissions'

export interface PermissionContextValue {
  permissions: Set<CognitoPermission>
  hasPermission: (permission: CognitoPermission) => boolean
  hasAnyPermission: (permissions: readonly CognitoPermission[]) => boolean
  hasAllPermissions: (permissions: readonly CognitoPermission[]) => boolean
}

export const PermissionContext = createContext<PermissionContextValue | null>(
  null,
)
