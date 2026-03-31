import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../../test-utils'
import { userStore } from '../../../../mocks/stores/userStore'
import { useListUsers } from '../../../../api/hooks/useUsers'
import { useTranslation } from 'react-i18next'

const POOL_ID = 'us-east-1_TestPool'

/**
 * A simplified test component that exercises the hooks and renders
 * the list page content without requiring TanStack Router context.
 */
function UserListTestHarness() {
  const { t } = useTranslation('users')
  const { data, isLoading } = useListUsers({ UserPoolId: POOL_ID, Limit: 60 })

  if (isLoading) {
    return <div>{t('common:loading')}</div>
  }

  const users = data?.Users ?? []

  return (
    <div>
      <h1>{t('list.title')}</h1>
      {users.length === 0 ? (
        <div>{t('list.emptyTitle')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('list.columns.username')}</th>
              <th>{t('list.columns.email')}</th>
              <th>{t('list.columns.status')}</th>
              <th>{t('list.columns.enabled')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.Username}>
                <td>{user.Username}</td>
                <td>
                  {user.Attributes?.find((a) => a.Name === 'email')?.Value ?? '—'}
                </td>
                <td>{user.UserStatus}</td>
                <td>{user.Enabled === true ? 'Enabled' : 'Disabled'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

describe('UserList integration', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('shows empty state when no users exist', async () => {
    renderWithProviders(<UserListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('No users')).toBeInTheDocument()
    })
  })

  it('renders users from MSW', async () => {
    userStore.create(POOL_ID, {
      Username: 'alice',
      UserAttributes: [{ Name: 'email', Value: 'alice@example.com' }],
    })
    userStore.create(POOL_ID, {
      Username: 'bob',
      UserAttributes: [{ Name: 'email', Value: 'bob@example.com' }],
    })

    renderWithProviders(<UserListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument()
      expect(screen.getByText('bob')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    renderWithProviders(<UserListTestHarness />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays user emails', async () => {
    userStore.create(POOL_ID, {
      Username: 'emailtest',
      UserAttributes: [{ Name: 'email', Value: 'emailtest@example.com' }],
    })

    renderWithProviders(<UserListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('emailtest@example.com')).toBeInTheDocument()
    })
  })

  it('renders correct column headers', async () => {
    userStore.create(POOL_ID, { Username: 'headertest' })

    renderWithProviders(<UserListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('Username')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })
  })

  it('displays user status', async () => {
    userStore.create(POOL_ID, { Username: 'statususer' })
    userStore.confirmSignUp(POOL_ID, 'statususer')

    renderWithProviders(<UserListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument()
    })
  })

  it('displays enabled/disabled state', async () => {
    userStore.create(POOL_ID, { Username: 'enableduser' })
    userStore.create(POOL_ID, { Username: 'disableduser' })
    userStore.disableUser(POOL_ID, 'disableduser')

    renderWithProviders(<UserListTestHarness />)

    await waitFor(() => {
      // "Enabled" appears in both the column header and a cell value, so use getAllByText
      const enabledElements = screen.getAllByText('Enabled')
      expect(enabledElements.length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText('Disabled')).toBeInTheDocument()
    })
  })
})

describe('useListUsers hook', () => {
  beforeEach(() => {
    userStore.clear()
  })

  function HookTestHarness({ limit }: { limit: number }) {
    const { data, isLoading, isError } = useListUsers({
      UserPoolId: POOL_ID,
      Limit: limit,
    })

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data && (
          <>
            <span data-testid="count">{data.Users?.length ?? 0}</span>
            {data.PaginationToken !== undefined && (
              <span data-testid="next-token">{data.PaginationToken}</span>
            )}
          </>
        )}
      </div>
    )
  }

  it('fetches users', async () => {
    userStore.create(POOL_ID, { Username: 'hookuser1' })
    userStore.create(POOL_ID, { Username: 'hookuser2' })

    renderWithProviders(<HookTestHarness limit={10} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
    })
  })

  it('handles pagination via Limit', async () => {
    for (let i = 0; i < 5; i++) {
      userStore.create(POOL_ID, { Username: `paginated${String(i)}` })
    }

    renderWithProviders(<HookTestHarness limit={2} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
      expect(screen.getByTestId('next-token')).toBeInTheDocument()
    })
  })
})
