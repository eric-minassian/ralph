import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test-utils'
import { userPoolStore } from '../../mocks/stores/userPoolStore'
import { useListUserPools } from '../../api/hooks/useUserPools'
import { useTranslation } from 'react-i18next'

/**
 * A simplified test component that exercises the hooks and renders
 * the list page content without requiring TanStack Router context.
 */
function UserPoolListTestHarness() {
  const { t } = useTranslation('userPools')
  const { data, isLoading } = useListUserPools({ MaxResults: 60 })

  if (isLoading) {
    return <div>{t('common:loading')}</div>
  }

  const pools = data?.UserPools ?? []

  return (
    <div>
      <h1>{t('list.title')}</h1>
      {pools.length === 0 ? (
        <div>{t('list.emptyTitle')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('list.columns.name')}</th>
              <th>{t('list.columns.id')}</th>
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) => (
              <tr key={pool.Id}>
                <td>{pool.Name}</td>
                <td>{pool.Id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

describe('UserPoolList integration', () => {
  beforeEach(() => {
    userPoolStore.clear()
  })

  it('shows empty state when no pools exist', async () => {
    renderWithProviders(<UserPoolListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('No user pools')).toBeInTheDocument()
    })
  })

  it('renders user pools from MSW', async () => {
    userPoolStore.create({ PoolName: 'MyPool' })
    userPoolStore.create({ PoolName: 'AnotherPool' })

    renderWithProviders(<UserPoolListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('MyPool')).toBeInTheDocument()
      expect(screen.getByText('AnotherPool')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    renderWithProviders(<UserPoolListTestHarness />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays pool IDs in the table', async () => {
    const pool = userPoolStore.create({ PoolName: 'IDTest' })

    renderWithProviders(<UserPoolListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText(pool.Id ?? '')).toBeInTheDocument()
    })
  })

  it('renders correct column headers', async () => {
    userPoolStore.create({ PoolName: 'HeaderTest' })

    renderWithProviders(<UserPoolListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('ID')).toBeInTheDocument()
    })
  })
})

describe('useListUserPools hook', () => {
  beforeEach(() => {
    userPoolStore.clear()
  })

  function HookTestHarness({ maxResults }: { maxResults: number }) {
    const { data, isLoading, isError } = useListUserPools({
      MaxResults: maxResults,
    })

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data && (
          <>
            <span data-testid="count">{data.UserPools?.length ?? 0}</span>
            {data.NextToken !== undefined && (
              <span data-testid="next-token">{data.NextToken}</span>
            )}
          </>
        )}
      </div>
    )
  }

  it('fetches user pools', async () => {
    userPoolStore.create({ PoolName: 'HookPool1' })
    userPoolStore.create({ PoolName: 'HookPool2' })

    renderWithProviders(<HookTestHarness maxResults={10} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
    })
  })

  it('handles pagination via MaxResults', async () => {
    for (let i = 0; i < 5; i++) {
      userPoolStore.create({ PoolName: `Paginated${String(i)}` })
    }

    renderWithProviders(<HookTestHarness maxResults={2} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
      expect(screen.getByTestId('next-token')).toBeInTheDocument()
    })
  })
})
