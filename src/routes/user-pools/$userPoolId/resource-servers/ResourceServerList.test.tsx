import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../../test-utils'
import { resourceServerStore } from '../../../../mocks/stores/resourceServerStore'
import {
  useListResourceServers,
  useDescribeResourceServer,
  useCreateResourceServer,
  useDeleteResourceServer,
} from '../../../../api/hooks/useResourceServers'
import { useTranslation } from 'react-i18next'

const POOL_ID = 'us-east-1_TestPool'

function ResourceServerListTestHarness() {
  const { t } = useTranslation('resourceServers')
  const { data, isLoading } = useListResourceServers({ UserPoolId: POOL_ID, MaxResults: 60 })

  if (isLoading) {
    return <div>{t('common:loading')}</div>
  }

  const servers = data?.ResourceServers ?? []

  return (
    <div>
      <h1>{t('list.title')}</h1>
      {servers.length === 0 ? (
        <div>{t('list.emptyTitle')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('list.columns.name')}</th>
              <th>{t('list.columns.identifier')}</th>
              <th>{t('list.columns.scopeCount')}</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((rs) => (
              <tr key={rs.Identifier}>
                <td>{rs.Name}</td>
                <td>{rs.Identifier}</td>
                <td>{String(rs.Scopes?.length ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

describe('ResourceServerList integration', () => {
  beforeEach(() => {
    resourceServerStore.clear()
  })

  it('shows empty state when no resource servers exist', async () => {
    renderWithProviders(<ResourceServerListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('No resource servers')).toBeInTheDocument()
    })
  })

  it('renders resource servers from MSW', async () => {
    resourceServerStore.create(POOL_ID, {
      Identifier: 'https://api.example.com',
      Name: 'Example API',
      Scopes: [{ ScopeName: 'read', ScopeDescription: 'Read' }],
    })
    resourceServerStore.create(POOL_ID, {
      Identifier: 'https://orders.example.com',
      Name: 'Orders Service',
    })

    renderWithProviders(<ResourceServerListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('Example API')).toBeInTheDocument()
      expect(screen.getByText('Orders Service')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    renderWithProviders(<ResourceServerListTestHarness />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays scope counts', async () => {
    resourceServerStore.create(POOL_ID, {
      Identifier: 'https://test.com',
      Name: 'Test',
      Scopes: [
        { ScopeName: 'read', ScopeDescription: 'Read' },
        { ScopeName: 'write', ScopeDescription: 'Write' },
      ],
    })

    renderWithProviders(<ResourceServerListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('renders correct column headers', async () => {
    resourceServerStore.create(POOL_ID, { Identifier: 'https://test.com', Name: 'HeaderTest' })

    renderWithProviders(<ResourceServerListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Identifier')).toBeInTheDocument()
      expect(screen.getByText('Number of scopes')).toBeInTheDocument()
    })
  })
})

describe('useListResourceServers hook', () => {
  beforeEach(() => {
    resourceServerStore.clear()
  })

  function HookTestHarness({ maxResults }: { maxResults: number }) {
    const { data, isLoading, isError } = useListResourceServers({
      UserPoolId: POOL_ID,
      MaxResults: maxResults,
    })

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data && (
          <>
            <span data-testid="count">{data.ResourceServers?.length ?? 0}</span>
            {data.NextToken !== undefined && (
              <span data-testid="next-token">{data.NextToken}</span>
            )}
          </>
        )}
      </div>
    )
  }

  it('fetches resource servers', async () => {
    resourceServerStore.create(POOL_ID, { Identifier: 'https://a.com', Name: 'A' })
    resourceServerStore.create(POOL_ID, { Identifier: 'https://b.com', Name: 'B' })

    renderWithProviders(<HookTestHarness maxResults={10} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
    })
  })

  it('handles pagination via MaxResults', async () => {
    for (let i = 0; i < 5; i++) {
      resourceServerStore.create(POOL_ID, {
        Identifier: `https://${String(i)}.com`,
        Name: `Server ${String(i)}`,
      })
    }

    renderWithProviders(<HookTestHarness maxResults={2} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
      expect(screen.getByTestId('next-token')).toBeInTheDocument()
    })
  })
})

describe('useDescribeResourceServer hook', () => {
  beforeEach(() => {
    resourceServerStore.clear()
  })

  function DetailHarness({ identifier }: { identifier: string }) {
    const { data, isLoading, isError } = useDescribeResourceServer(POOL_ID, identifier)

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data?.ResourceServer && (
          <>
            <span data-testid="name">{data.ResourceServer.Name}</span>
            <span data-testid="identifier">{data.ResourceServer.Identifier}</span>
          </>
        )}
      </div>
    )
  }

  it('fetches a specific resource server', async () => {
    resourceServerStore.create(POOL_ID, {
      Identifier: 'https://detail.com',
      Name: 'Detail Test',
    })

    renderWithProviders(<DetailHarness identifier="https://detail.com" />)

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('Detail Test')
      expect(screen.getByTestId('identifier')).toHaveTextContent('https://detail.com')
    })
  })
})

describe('useCreateResourceServer mutation', () => {
  beforeEach(() => {
    resourceServerStore.clear()
  })

  function CreateHarness() {
    const createResourceServer = useCreateResourceServer()

    return (
      <div>
        <button
          onClick={() => {
            createResourceServer.mutate({
              UserPoolId: POOL_ID,
              Identifier: 'https://new.com',
              Name: 'New Server',
              Scopes: [{ ScopeName: 'read', ScopeDescription: 'Read' }],
            })
          }}
        >
          Create
        </button>
        {createResourceServer.isSuccess && <span data-testid="success">created</span>}
        {createResourceServer.isError && <span data-testid="error">error</span>}
      </div>
    )
  }

  it('creates a resource server via mutation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateHarness />)

    await user.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })

    const rs = resourceServerStore.describe(POOL_ID, 'https://new.com')
    expect(rs.Name).toBe('New Server')
    expect(rs.Scopes).toHaveLength(1)
  })
})

describe('useDeleteResourceServer mutation', () => {
  beforeEach(() => {
    resourceServerStore.clear()
  })

  function DeleteHarness() {
    const deleteResourceServer = useDeleteResourceServer()

    return (
      <div>
        <button
          onClick={() => {
            deleteResourceServer.mutate({
              UserPoolId: POOL_ID,
              Identifier: 'https://todelete.com',
            })
          }}
        >
          Delete
        </button>
        {deleteResourceServer.isSuccess && <span data-testid="success">deleted</span>}
      </div>
    )
  }

  it('deletes a resource server via mutation', async () => {
    resourceServerStore.create(POOL_ID, {
      Identifier: 'https://todelete.com',
      Name: 'To Delete',
    })

    const user = userEvent.setup()
    renderWithProviders(<DeleteHarness />)

    await user.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })

    expect(() => resourceServerStore.describe(POOL_ID, 'https://todelete.com')).toThrow()
  })
})
