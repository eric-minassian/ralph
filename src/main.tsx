import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nProvider } from '@cloudscape-design/components/i18n'
import enMessages from '@cloudscape-design/components/i18n/messages/all.en'
import { NotificationProvider } from './contexts/NotificationProvider'
import { PermissionProvider } from './contexts/PermissionProvider'
import { ALL_COGNITO_PERMISSIONS } from './types/permissions'
import { routeTree } from './routeTree.gen'
import './i18n'
import '@cloudscape-design/global-styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') {
    return
  }

  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

void enableMocking().then(() => {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <I18nProvider locale="en" messages={[enMessages]}>
        <QueryClientProvider client={queryClient}>
          <PermissionProvider
            permissions={new Set(ALL_COGNITO_PERMISSIONS)}
          >
            <NotificationProvider>
              <RouterProvider router={router} />
            </NotificationProvider>
          </PermissionProvider>
        </QueryClientProvider>
      </I18nProvider>
    </StrictMode>,
  )
})
