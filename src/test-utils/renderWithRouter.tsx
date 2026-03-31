import { render } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from 'i18next'
import { createTestQueryClient } from './createTestQueryClient'
import { PermissionProvider } from '../contexts/PermissionProvider'
import { NotificationProvider } from '../contexts/NotificationProvider'
import type { CognitoPermission } from '../types/permissions'
import { ALL_COGNITO_PERMISSIONS } from '../types/permissions'

interface RenderWithRouterOptions {
  permissions?: Set<CognitoPermission>
  initialEntries?: string[]
}

/**
 * Renders a component within a full TanStack Router context.
 * Use this for components that call useRouter(), useMatches(), etc.
 * Must be awaited since the router loads asynchronously.
 */
export async function renderWithRouter(
  Component: React.ComponentType,
  options: RenderWithRouterOptions = {},
) {
  const {
    permissions = new Set<CognitoPermission>(ALL_COGNITO_PERMISSIONS),
    initialEntries = ['/'],
  } = options

  const queryClient = createTestQueryClient()

  const rootRoute = createRootRoute({
    component: Component,
  })

  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries }),
    context: { queryClient },
  })

  await router.load()

  const result = render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <PermissionProvider permissions={permissions}>
          <NotificationProvider>
            <RouterProvider router={router} />
          </NotificationProvider>
        </PermissionProvider>
      </QueryClientProvider>
    </I18nextProvider>,
  )

  return { ...result, queryClient, router }
}
