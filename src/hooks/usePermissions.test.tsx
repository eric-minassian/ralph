import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { usePermissions } from './usePermissions'
import { PermissionProvider } from '../contexts/PermissionProvider'
import type { CognitoPermission } from '../types/permissions'

function createWrapper(permissions: Set<CognitoPermission>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <PermissionProvider permissions={permissions}>
        {children}
      </PermissionProvider>
    )
  }
}

describe('usePermissions', () => {
  it('throws when used outside PermissionProvider', () => {
    expect(() => {
      renderHook(() => usePermissions())
    }).toThrow('usePermissions must be used within a PermissionProvider')
  })

  it('returns the permission set', () => {
    const perms = new Set<CognitoPermission>(['ListUserPools', 'CreateGroup'])
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(perms),
    })

    expect(result.current.permissions).toBe(perms)
  })

  describe('hasPermission', () => {
    it('returns true for a granted permission', () => {
      const perms = new Set<CognitoPermission>(['ListUserPools'])
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(perms),
      })

      expect(result.current.hasPermission('ListUserPools')).toBe(true)
    })

    it('returns false for a missing permission', () => {
      const perms = new Set<CognitoPermission>(['ListUserPools'])
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(perms),
      })

      expect(result.current.hasPermission('CreateUserPool')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('returns true when at least one permission is granted', () => {
      const perms = new Set<CognitoPermission>(['ListUserPools'])
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(perms),
      })

      expect(
        result.current.hasAnyPermission(['ListUserPools', 'CreateUserPool']),
      ).toBe(true)
    })

    it('returns false when none of the permissions are granted', () => {
      const perms = new Set<CognitoPermission>(['ListUserPools'])
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(perms),
      })

      expect(
        result.current.hasAnyPermission(['CreateUserPool', 'DeleteUserPool']),
      ).toBe(false)
    })

    it('returns false for an empty array', () => {
      const perms = new Set<CognitoPermission>(['ListUserPools'])
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(perms),
      })

      expect(result.current.hasAnyPermission([])).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('returns true when all permissions are granted', () => {
      const perms = new Set<CognitoPermission>([
        'ListUserPools',
        'CreateUserPool',
      ])
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(perms),
      })

      expect(
        result.current.hasAllPermissions(['ListUserPools', 'CreateUserPool']),
      ).toBe(true)
    })

    it('returns false when some permissions are missing', () => {
      const perms = new Set<CognitoPermission>(['ListUserPools'])
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(perms),
      })

      expect(
        result.current.hasAllPermissions(['ListUserPools', 'CreateUserPool']),
      ).toBe(false)
    })

    it('returns true for an empty array', () => {
      const perms = new Set<CognitoPermission>(['ListUserPools'])
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(perms),
      })

      expect(result.current.hasAllPermissions([])).toBe(true)
    })
  })
})
