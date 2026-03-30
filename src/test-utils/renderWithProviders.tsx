import type { ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from 'i18next'
import { createTestQueryClient } from './createTestQueryClient'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

/**
 * Renders a component wrapped in all required providers:
 * - TanStack QueryClientProvider (with test-configured client)
 * - I18nextProvider (uses test i18n instance from test-setup.ts)
 *
 * Placeholder provider (PermissionProvider) will be added by TASK-005.
 */
export function renderWithProviders(
  ui: ReactNode,
  options: RenderWithProvidersOptions = {},
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </I18nextProvider>
    )
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions })

  return { ...result, queryClient }
}
