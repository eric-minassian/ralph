import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../../test-utils'
import { appClientStore } from '../../../../mocks/stores/appClientStore'
import {
  useListAppClients,
  useDescribeAppClient,
  useCreateAppClient,
  useDeleteAppClient,
  useAddAppClientSecret,
  useListAppClientSecrets,
  useDeleteAppClientSecret,
} from '../../../../api/hooks/useAppClients'
import { useTranslation } from 'react-i18next'

const POOL_ID = 'us-east-1_TestPool'

function AppClientListTestHarness() {
  const { t } = useTranslation('appClients')
  const { data, isLoading } = useListAppClients({ UserPoolId: POOL_ID, MaxResults: 60 })

  if (isLoading) {
    return <div>{t('common:loading')}</div>
  }

  const clients = data?.UserPoolClients ?? []

  return (
    <div>
      <h1>{t('list.title')}</h1>
      {clients.length === 0 ? (
        <div>{t('list.emptyTitle')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('list.columns.clientName')}</th>
              <th>{t('list.columns.clientId')}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.ClientId}>
                <td>{client.ClientName}</td>
                <td>{client.ClientId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

describe('AppClientList integration', () => {
  beforeEach(() => {
    appClientStore.clear()
  })

  it('shows empty state when no clients exist', async () => {
    renderWithProviders(<AppClientListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('No app clients')).toBeInTheDocument()
    })
  })

  it('renders clients from MSW', async () => {
    appClientStore.create(POOL_ID, { ClientName: 'WebApp' })
    appClientStore.create(POOL_ID, { ClientName: 'MobileApp' })

    renderWithProviders(<AppClientListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('WebApp')).toBeInTheDocument()
      expect(screen.getByText('MobileApp')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    renderWithProviders(<AppClientListTestHarness />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders correct column headers', async () => {
    appClientStore.create(POOL_ID, { ClientName: 'HeaderTest' })

    renderWithProviders(<AppClientListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('Client name')).toBeInTheDocument()
      expect(screen.getByText('Client ID')).toBeInTheDocument()
    })
  })
})

describe('useListAppClients hook', () => {
  beforeEach(() => {
    appClientStore.clear()
  })

  function HookTestHarness({ maxResults }: { maxResults: number }) {
    const { data, isLoading, isError } = useListAppClients({
      UserPoolId: POOL_ID,
      MaxResults: maxResults,
    })

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data && (
          <>
            <span data-testid="count">{data.UserPoolClients?.length ?? 0}</span>
            {data.NextToken !== undefined && (
              <span data-testid="next-token">{data.NextToken}</span>
            )}
          </>
        )}
      </div>
    )
  }

  it('fetches clients', async () => {
    appClientStore.create(POOL_ID, { ClientName: 'hook1' })
    appClientStore.create(POOL_ID, { ClientName: 'hook2' })

    renderWithProviders(<HookTestHarness maxResults={10} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
    })
  })

  it('handles pagination via MaxResults', async () => {
    for (let i = 0; i < 5; i++) {
      appClientStore.create(POOL_ID, { ClientName: `paginated${String(i)}` })
    }

    renderWithProviders(<HookTestHarness maxResults={2} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
      expect(screen.getByTestId('next-token')).toBeInTheDocument()
    })
  })
})

describe('useDescribeAppClient hook', () => {
  beforeEach(() => {
    appClientStore.clear()
  })

  function DetailHarness({ clientId }: { clientId: string }) {
    const { data, isLoading, isError } = useDescribeAppClient(POOL_ID, clientId)

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data?.UserPoolClient && (
          <>
            <span data-testid="name">{data.UserPoolClient.ClientName}</span>
            <span data-testid="id">{data.UserPoolClient.ClientId}</span>
          </>
        )}
      </div>
    )
  }

  it('fetches a specific client', async () => {
    const created = appClientStore.create(POOL_ID, { ClientName: 'FetchMe' })
    const clientId = created.ClientId ?? ''

    renderWithProviders(<DetailHarness clientId={clientId} />)

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('FetchMe')
    })
  })
})

describe('useCreateAppClient mutation', () => {
  beforeEach(() => {
    appClientStore.clear()
  })

  function CreateHarness() {
    const createClient = useCreateAppClient()

    return (
      <div>
        <button
          onClick={() => {
            createClient.mutate({
              UserPoolId: POOL_ID,
              ClientName: 'NewClient',
              ExplicitAuthFlows: ['ALLOW_USER_SRP_AUTH'],
            })
          }}
        >
          Create
        </button>
        {createClient.isSuccess && <span data-testid="success">created</span>}
        {createClient.isError && <span data-testid="error">error</span>}
      </div>
    )
  }

  it('creates a client via mutation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateHarness />)

    await user.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })

    const result = appClientStore.list(POOL_ID, 10)
    expect(result.UserPoolClients).toHaveLength(1)
    expect(result.UserPoolClients[0]?.ClientName).toBe('NewClient')
  })
})

describe('useDeleteAppClient mutation', () => {
  beforeEach(() => {
    appClientStore.clear()
  })

  function DeleteHarness({ clientId }: { clientId: string }) {
    const deleteClient = useDeleteAppClient()

    return (
      <div>
        <button
          onClick={() => {
            deleteClient.mutate({
              UserPoolId: POOL_ID,
              ClientId: clientId,
            })
          }}
        >
          Delete
        </button>
        {deleteClient.isSuccess && <span data-testid="success">deleted</span>}
      </div>
    )
  }

  it('deletes a client via mutation', async () => {
    const created = appClientStore.create(POOL_ID, { ClientName: 'ToDelete' })
    const clientId = created.ClientId ?? ''

    const user = userEvent.setup()
    renderWithProviders(<DeleteHarness clientId={clientId} />)

    await user.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })

    expect(() => appClientStore.describe(POOL_ID, clientId)).toThrow()
  })
})

describe('secret hooks', () => {
  beforeEach(() => {
    appClientStore.clear()
  })

  function AddSecretHarness({ clientId }: { clientId: string }) {
    const addSecret = useAddAppClientSecret()

    return (
      <div>
        <button
          onClick={() => {
            addSecret.mutate({ UserPoolId: POOL_ID, ClientId: clientId })
          }}
        >
          Add Secret
        </button>
        {addSecret.isSuccess && <span data-testid="success">added</span>}
        {addSecret.data?.ClientSecretDescriptor?.ClientSecretValue && (
          <span data-testid="secret-value">
            {addSecret.data.ClientSecretDescriptor.ClientSecretValue}
          </span>
        )}
      </div>
    )
  }

  it('adds a secret via mutation', async () => {
    const created = appClientStore.create(POOL_ID, { ClientName: 'SecretApp' })
    const clientId = created.ClientId ?? ''

    const user = userEvent.setup()
    renderWithProviders(<AddSecretHarness clientId={clientId} />)

    await user.click(screen.getByText('Add Secret'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
      expect(screen.getByTestId('secret-value')).toBeInTheDocument()
    })
  })

  function ListSecretsHarness({ clientId }: { clientId: string }) {
    const { data, isLoading } = useListAppClientSecrets(POOL_ID, clientId)

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {data && <span data-testid="count">{data.ClientSecrets?.length ?? 0}</span>}
      </div>
    )
  }

  it('lists secrets', async () => {
    const created = appClientStore.create(POOL_ID, { ClientName: 'ListSec' })
    const clientId = created.ClientId ?? ''
    appClientStore.addSecret(POOL_ID, clientId)
    appClientStore.addSecret(POOL_ID, clientId)

    renderWithProviders(<ListSecretsHarness clientId={clientId} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
    })
  })

  function DeleteSecretHarness({ clientId, secretId }: { clientId: string; secretId: string }) {
    const deleteSecret = useDeleteAppClientSecret()

    return (
      <div>
        <button
          onClick={() => {
            deleteSecret.mutate({
              UserPoolId: POOL_ID,
              ClientId: clientId,
              ClientSecretId: secretId,
            })
          }}
        >
          Delete Secret
        </button>
        {deleteSecret.isSuccess && <span data-testid="success">deleted</span>}
      </div>
    )
  }

  it('deletes a secret via mutation', async () => {
    const created = appClientStore.create(POOL_ID, { ClientName: 'DelSec' })
    const clientId = created.ClientId ?? ''
    const secret = appClientStore.addSecret(POOL_ID, clientId)

    const user = userEvent.setup()
    renderWithProviders(
      <DeleteSecretHarness clientId={clientId} secretId={secret.ClientSecretId} />,
    )

    await user.click(screen.getByText('Delete Secret'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })

    const result = appClientStore.listSecrets(POOL_ID, clientId)
    expect(result.ClientSecrets).toHaveLength(0)
  })
})
