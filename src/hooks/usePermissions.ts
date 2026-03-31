import { useContext } from 'react'
import {
  PermissionContext,
  type PermissionContextValue,
} from '../contexts/permissionContext'

export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext)
  if (context === null) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}
