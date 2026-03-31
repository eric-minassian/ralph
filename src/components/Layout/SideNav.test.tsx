import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../../test-utils'
import { SideNav } from './SideNav'
import type { CognitoPermission } from '../../types/permissions'

describe('SideNav', () => {
  it('renders all navigation items with full permissions', async () => {
    await renderWithRouter(SideNav)

    expect(screen.getByText('User Pools')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Groups')).toBeInTheDocument()
    expect(screen.getByText('App Clients')).toBeInTheDocument()
    expect(screen.getByText('Identity Providers')).toBeInTheDocument()
    expect(screen.getByText('Domains')).toBeInTheDocument()
    expect(screen.getByText('Resource Servers')).toBeInTheDocument()
    expect(screen.getByText('Branding')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
  })

  it('renders section headers', async () => {
    await renderWithRouter(SideNav)

    expect(screen.getByText('Pool Resources')).toBeInTheDocument()
    expect(screen.getByText('Pool Configuration')).toBeInTheDocument()
  })

  it('hides items when user lacks permissions', async () => {
    const limitedPermissions = new Set<CognitoPermission>(['ListUserPools'])

    await renderWithRouter(SideNav, {
      permissions: limitedPermissions,
    })

    expect(screen.getByText('User Pools')).toBeInTheDocument()
    expect(screen.queryByText('Users')).not.toBeInTheDocument()
    expect(screen.queryByText('Groups')).not.toBeInTheDocument()
    expect(screen.queryByText('App Clients')).not.toBeInTheDocument()
  })

  it('shows items when user has any of the required permissions', async () => {
    const permissions = new Set<CognitoPermission>([
      'ListUserPools',
      'AdminGetUser',
    ])

    await renderWithRouter(SideNav, { permissions })

    expect(screen.getByText('User Pools')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.queryByText('Groups')).not.toBeInTheDocument()
  })

  it('hides entire sections when no items are visible', async () => {
    const permissions = new Set<CognitoPermission>(['ListUserPools'])

    await renderWithRouter(SideNav, { permissions })

    expect(screen.queryByText('Pool Resources')).not.toBeInTheDocument()
    expect(screen.queryByText('Pool Configuration')).not.toBeInTheDocument()
  })

  it('shows empty state with no permissions', async () => {
    const permissions = new Set<CognitoPermission>([])

    await renderWithRouter(SideNav, { permissions })

    expect(screen.queryByText('User Pools')).not.toBeInTheDocument()
    expect(screen.queryByText('Users')).not.toBeInTheDocument()
  })
})
