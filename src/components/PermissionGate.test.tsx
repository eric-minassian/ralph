import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { PermissionGate } from './PermissionGate'
import { renderWithProviders } from '../test-utils'
import type { CognitoPermission } from '../types/permissions'

describe('PermissionGate', () => {
  describe('single permission', () => {
    it('renders children when the permission is granted', () => {
      renderWithProviders(
        <PermissionGate permission="ListUserPools">
          <span data-testid="content">Visible</span>
        </PermissionGate>,
        {
          permissions: new Set<CognitoPermission>(['ListUserPools']),
        },
      )

      expect(screen.getByTestId('content')).toHaveTextContent('Visible')
    })

    it('hides children when the permission is not granted', () => {
      renderWithProviders(
        <PermissionGate permission="ListUserPools">
          <span data-testid="content">Visible</span>
        </PermissionGate>,
        {
          permissions: new Set<CognitoPermission>(['CreateUserPool']),
        },
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('renders fallback when the permission is not granted', () => {
      renderWithProviders(
        <PermissionGate
          permission="ListUserPools"
          fallback={<span data-testid="fallback">Denied</span>}
        >
          <span data-testid="content">Visible</span>
        </PermissionGate>,
        {
          permissions: new Set<CognitoPermission>([]),
        },
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
      expect(screen.getByTestId('fallback')).toHaveTextContent('Denied')
    })
  })

  describe('anyOf (OR logic)', () => {
    it('renders when at least one permission is granted', () => {
      renderWithProviders(
        <PermissionGate anyOf={['ListUserPools', 'CreateUserPool']}>
          <span data-testid="content">Visible</span>
        </PermissionGate>,
        {
          permissions: new Set<CognitoPermission>(['CreateUserPool']),
        },
      )

      expect(screen.getByTestId('content')).toHaveTextContent('Visible')
    })

    it('hides when none of the permissions are granted', () => {
      renderWithProviders(
        <PermissionGate anyOf={['ListUserPools', 'CreateUserPool']}>
          <span data-testid="content">Visible</span>
        </PermissionGate>,
        {
          permissions: new Set<CognitoPermission>(['DeleteUserPool']),
        },
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })
  })

  describe('allOf (AND logic)', () => {
    it('renders when all permissions are granted', () => {
      renderWithProviders(
        <PermissionGate allOf={['ListUserPools', 'CreateUserPool']}>
          <span data-testid="content">Visible</span>
        </PermissionGate>,
        {
          permissions: new Set<CognitoPermission>([
            'ListUserPools',
            'CreateUserPool',
          ]),
        },
      )

      expect(screen.getByTestId('content')).toHaveTextContent('Visible')
    })

    it('hides when some permissions are missing', () => {
      renderWithProviders(
        <PermissionGate allOf={['ListUserPools', 'CreateUserPool']}>
          <span data-testid="content">Visible</span>
        </PermissionGate>,
        {
          permissions: new Set<CognitoPermission>(['ListUserPools']),
        },
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })
  })
})
