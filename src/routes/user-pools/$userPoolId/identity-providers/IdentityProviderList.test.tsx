import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../../test-utils'
import { identityProviderStore } from '../../../../mocks/stores/identityProviderStore'
import {
  useListIdentityProviders,
  useDescribeIdentityProvider,
  useCreateIdentityProvider,
  useDeleteIdentityProvider,
  useUpdateIdentityProvider,
  useGetIdentityProviderByIdentifier,
} from '../../../../api/hooks/useIdentityProviders'
import { useTranslation } from 'react-i18next'

const POOL_ID = 'us-east-1_TestPool'

function IdPListTestHarness() {
  const { t } = useTranslation('identityProviders')
  const { data, isLoading } = useListIdentityProviders({ UserPoolId: POOL_ID, MaxResults: 60 })

  if (isLoading) {
    return <div>{t('common:loading')}</div>
  }

  const providers = data?.Providers ?? []

  return (
    <div>
      <h1>{t('list.title')}</h1>
      {providers.length === 0 ? (
        <div>{t('list.emptyTitle')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('list.columns.providerName')}</th>
              <th>{t('list.columns.providerType')}</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.ProviderName}>
                <td>{p.ProviderName}</td>
                <td>{p.ProviderType ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

describe('IdentityProviderList integration', () => {
  beforeEach(() => {
    identityProviderStore.clear()
  })

  it('shows empty state when no providers exist', async () => {
    renderWithProviders(<IdPListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('No identity providers')).toBeInTheDocument()
    })
  })

  it('renders providers from MSW', async () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'OktaSAML', ProviderType: 'SAML' })
    identityProviderStore.create(POOL_ID, { ProviderName: 'Auth0OIDC', ProviderType: 'OIDC' })

    renderWithProviders(<IdPListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('OktaSAML')).toBeInTheDocument()
      expect(screen.getByText('Auth0OIDC')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    renderWithProviders(<IdPListTestHarness />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays provider types', async () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'GoogleP', ProviderType: 'Google' })

    renderWithProviders(<IdPListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument()
    })
  })

  it('renders correct column headers', async () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'ColTest', ProviderType: 'OIDC' })

    renderWithProviders(<IdPListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('Provider name')).toBeInTheDocument()
      expect(screen.getByText('Provider type')).toBeInTheDocument()
    })
  })
})

describe('useListIdentityProviders hook', () => {
  beforeEach(() => {
    identityProviderStore.clear()
  })

  function HookTestHarness({ maxResults }: { maxResults: number }) {
    const { data, isLoading, isError } = useListIdentityProviders({
      UserPoolId: POOL_ID,
      MaxResults: maxResults,
    })

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data && (
          <>
            <span data-testid="count">{data.Providers?.length ?? 0}</span>
            {data.NextToken !== undefined && (
              <span data-testid="next-token">{data.NextToken}</span>
            )}
          </>
        )}
      </div>
    )
  }

  it('fetches providers', async () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'hook1', ProviderType: 'OIDC' })
    identityProviderStore.create(POOL_ID, { ProviderName: 'hook2', ProviderType: 'SAML' })

    renderWithProviders(<HookTestHarness maxResults={10} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
    })
  })

  it('handles pagination', async () => {
    for (let i = 0; i < 5; i++) {
      identityProviderStore.create(POOL_ID, { ProviderName: `paginated${String(i)}`, ProviderType: 'OIDC' })
    }

    renderWithProviders(<HookTestHarness maxResults={2} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
      expect(screen.getByTestId('next-token')).toBeInTheDocument()
    })
  })
})

describe('useDescribeIdentityProvider hook', () => {
  beforeEach(() => {
    identityProviderStore.clear()
  })

  function DetailHarness({ providerName }: { providerName: string }) {
    const { data, isLoading, isError } = useDescribeIdentityProvider(POOL_ID, providerName)

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data?.IdentityProvider && (
          <>
            <span data-testid="name">{data.IdentityProvider.ProviderName}</span>
            <span data-testid="type">{data.IdentityProvider.ProviderType ?? 'none'}</span>
          </>
        )}
      </div>
    )
  }

  it('fetches a specific provider', async () => {
    identityProviderStore.create(POOL_ID, {
      ProviderName: 'FetchMe',
      ProviderType: 'OIDC',
      ProviderDetails: { client_id: 'test-client' },
    })

    renderWithProviders(<DetailHarness providerName="FetchMe" />)

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('FetchMe')
      expect(screen.getByTestId('type')).toHaveTextContent('OIDC')
    })
  })
})

describe('useGetIdentityProviderByIdentifier hook', () => {
  beforeEach(() => {
    identityProviderStore.clear()
  })

  function ByIdHarness({ identifier }: { identifier: string }) {
    const { data, isLoading, isError } = useGetIdentityProviderByIdentifier(POOL_ID, identifier)

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data?.IdentityProvider && (
          <span data-testid="name">{data.IdentityProvider.ProviderName}</span>
        )}
      </div>
    )
  }

  it('fetches provider by identifier', async () => {
    identityProviderStore.create(POOL_ID, {
      ProviderName: 'ById',
      ProviderType: 'OIDC',
      IdpIdentifiers: ['find-me'],
    })

    renderWithProviders(<ByIdHarness identifier="find-me" />)

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('ById')
    })
  })
})

describe('useCreateIdentityProvider mutation', () => {
  beforeEach(() => {
    identityProviderStore.clear()
  })

  function CreateHarness() {
    const createProvider = useCreateIdentityProvider()

    return (
      <div>
        <button
          onClick={() => {
            createProvider.mutate({
              UserPoolId: POOL_ID,
              ProviderName: 'NewProvider',
              ProviderType: 'OIDC',
              ProviderDetails: { client_id: 'new-client', oidc_issuer: 'https://new.example.com' },
            })
          }}
        >
          Create
        </button>
        {createProvider.isSuccess && <span data-testid="success">created</span>}
        {createProvider.isError && <span data-testid="error">error</span>}
      </div>
    )
  }

  it('creates a provider via mutation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateHarness />)

    await user.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })

    const provider = identityProviderStore.describe(POOL_ID, 'NewProvider')
    expect(provider.ProviderType).toBe('OIDC')
    expect(provider.ProviderDetails?.client_id).toBe('new-client')
  })
})

describe('useUpdateIdentityProvider mutation', () => {
  beforeEach(() => {
    identityProviderStore.clear()
  })

  function UpdateHarness() {
    const updateProvider = useUpdateIdentityProvider()

    return (
      <div>
        <button
          onClick={() => {
            updateProvider.mutate({
              UserPoolId: POOL_ID,
              ProviderName: 'ToUpdate',
              ProviderDetails: { client_id: 'updated-id' },
              AttributeMapping: { email: 'new_email' },
            })
          }}
        >
          Update
        </button>
        {updateProvider.isSuccess && <span data-testid="success">updated</span>}
      </div>
    )
  }

  it('updates a provider via mutation', async () => {
    identityProviderStore.create(POOL_ID, {
      ProviderName: 'ToUpdate',
      ProviderType: 'OIDC',
      ProviderDetails: { client_id: 'old-id' },
    })

    const user = userEvent.setup()
    renderWithProviders(<UpdateHarness />)

    await user.click(screen.getByText('Update'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })

    const provider = identityProviderStore.describe(POOL_ID, 'ToUpdate')
    expect(provider.ProviderDetails?.client_id).toBe('updated-id')
    expect(provider.AttributeMapping?.email).toBe('new_email')
  })
})

describe('useDeleteIdentityProvider mutation', () => {
  beforeEach(() => {
    identityProviderStore.clear()
  })

  function DeleteHarness() {
    const deleteProvider = useDeleteIdentityProvider()

    return (
      <div>
        <button
          onClick={() => {
            deleteProvider.mutate({
              UserPoolId: POOL_ID,
              ProviderName: 'ToDelete',
            })
          }}
        >
          Delete
        </button>
        {deleteProvider.isSuccess && <span data-testid="success">deleted</span>}
      </div>
    )
  }

  it('deletes a provider via mutation', async () => {
    identityProviderStore.create(POOL_ID, { ProviderName: 'ToDelete', ProviderType: 'OIDC' })

    const user = userEvent.setup()
    renderWithProviders(<DeleteHarness />)

    await user.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })

    expect(() => identityProviderStore.describe(POOL_ID, 'ToDelete')).toThrow()
  })
})
