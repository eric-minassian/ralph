import type { ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from 'i18next'
import { createTestQueryClient } from './createTestQueryClient'
import { PermissionProvider } from '../contexts/PermissionProvider'
import type { CognitoPermission } from '../types/permissions'
import { ALL_COGNITO_PERMISSIONS } from '../types/permissions'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  permissions?: Set<CognitoPermission>
}

/**
 * Renders a component wrapped in all required providers:
 * - TanStack QueryClientProvider (with test-configured client)
 * - I18nextProvider (uses test i18n instance from test-setup.ts)
 * - PermissionProvider (defaults to all permissions granted)
 */
export function renderWithProviders(
  ui: ReactNode,
  options: RenderWithProvidersOptions = {},
) {
  const {
    queryClient = createTestQueryClient(),
    permissions = new Set<CognitoPermission>(ALL_COGNITO_PERMISSIONS),
    ...renderOptions
  } = options

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <PermissionProvider permissions={permissions}>
            {children}
          </PermissionProvider>
        </QueryClientProvider>
      </I18nextProvider>
    )
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions })

  return { ...result, queryClient }
}
