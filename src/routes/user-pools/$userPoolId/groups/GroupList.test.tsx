import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../../test-utils'
import { groupStore } from '../../../../mocks/stores/groupStore'
import { useListGroups, useGetGroup, useCreateGroup, useDeleteGroup } from '../../../../api/hooks/useGroups'
import { useTranslation } from 'react-i18next'

const POOL_ID = 'us-east-1_TestPool'

/**
 * Test harness that exercises hooks and renders list content
 * without requiring TanStack Router context.
 */
function GroupListTestHarness() {
  const { t } = useTranslation('groups')
  const { data, isLoading } = useListGroups({ UserPoolId: POOL_ID, Limit: 60 })

  if (isLoading) {
    return <div>{t('common:loading')}</div>
  }

  const groups = data?.Groups ?? []

  return (
    <div>
      <h1>{t('list.title')}</h1>
      {groups.length === 0 ? (
        <div>{t('list.emptyTitle')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('list.columns.groupName')}</th>
              <th>{t('list.columns.description')}</th>
              <th>{t('list.columns.precedence')}</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.GroupName}>
                <td>{group.GroupName}</td>
                <td>{group.Description ?? '—'}</td>
                <td>{group.Precedence !== undefined ? String(group.Precedence) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

describe('GroupList integration', () => {
  beforeEach(() => {
    groupStore.clear()
  })

  it('shows empty state when no groups exist', async () => {
    renderWithProviders(<GroupListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('No groups')).toBeInTheDocument()
    })
  })

  it('renders groups from MSW', async () => {
    groupStore.create(POOL_ID, { GroupName: 'Admins', Description: 'Admin group' })
    groupStore.create(POOL_ID, { GroupName: 'Editors', Description: 'Editor group' })

    renderWithProviders(<GroupListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('Admins')).toBeInTheDocument()
      expect(screen.getByText('Editors')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    renderWithProviders(<GroupListTestHarness />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays group descriptions', async () => {
    groupStore.create(POOL_ID, { GroupName: 'DescTest', Description: 'Test description' })

    renderWithProviders(<GroupListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })
  })

  it('renders correct column headers', async () => {
    groupStore.create(POOL_ID, { GroupName: 'HeaderTest' })

    renderWithProviders(<GroupListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('Group name')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Precedence')).toBeInTheDocument()
    })
  })

  it('displays precedence values', async () => {
    groupStore.create(POOL_ID, { GroupName: 'PrecTest', Precedence: 42 })

    renderWithProviders(<GroupListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })
})

describe('useListGroups hook', () => {
  beforeEach(() => {
    groupStore.clear()
  })

  function HookTestHarness({ limit }: { limit: number }) {
    const { data, isLoading, isError } = useListGroups({
      UserPoolId: POOL_ID,
      Limit: limit,
    })

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data && (
          <>
            <span data-testid="count">{data.Groups?.length ?? 0}</span>
            {data.NextToken !== undefined && (
              <span data-testid="next-token">{data.NextToken}</span>
            )}
          </>
        )}
      </div>
    )
  }

  it('fetches groups', async () => {
    groupStore.create(POOL_ID, { GroupName: 'hook1' })
    groupStore.create(POOL_ID, { GroupName: 'hook2' })

    renderWithProviders(<HookTestHarness limit={10} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
    })
  })

  it('handles pagination via Limit', async () => {
    for (let i = 0; i < 5; i++) {
      groupStore.create(POOL_ID, { GroupName: `paginated${String(i)}` })
    }

    renderWithProviders(<HookTestHarness limit={2} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
      expect(screen.getByTestId('next-token')).toBeInTheDocument()
    })
  })
})

describe('useGetGroup hook', () => {
  beforeEach(() => {
    groupStore.clear()
  })

  function DetailHarness({ groupName }: { groupName: string }) {
    const { data, isLoading, isError } = useGetGroup(POOL_ID, groupName)

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data?.Group && (
          <>
            <span data-testid="name">{data.Group.GroupName}</span>
            <span data-testid="desc">{data.Group.Description ?? 'none'}</span>
          </>
        )}
      </div>
    )
  }

  it('fetches a specific group', async () => {
    groupStore.create(POOL_ID, { GroupName: 'FetchMe', Description: 'desc' })

    renderWithProviders(<DetailHarness groupName="FetchMe" />)

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('FetchMe')
      expect(screen.getByTestId('desc')).toHaveTextContent('desc')
    })
  })
})

describe('useCreateGroup mutation', () => {
  beforeEach(() => {
    groupStore.clear()
  })

  function CreateHarness() {
    const createGroup = useCreateGroup()

    return (
      <div>
        <button
          onClick={() => {
            createGroup.mutate({
              UserPoolId: POOL_ID,
              GroupName: 'NewGroup',
              Description: 'Created via mutation',
            })
          }}
        >
          Create
        </button>
        {createGroup.isSuccess && <span data-testid="success">created</span>}
        {createGroup.isError && <span data-testid="error">error</span>}
      </div>
    )
  }

  it('creates a group via mutation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateHarness />)

    await user.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })

    const group = groupStore.describe(POOL_ID, 'NewGroup')
    expect(group.Description).toBe('Created via mutation')
  })
})

describe('useDeleteGroup mutation', () => {
  beforeEach(() => {
    groupStore.clear()
  })

  function DeleteHarness() {
    const deleteGroup = useDeleteGroup()

    return (
      <div>
        <button
          onClick={() => {
            deleteGroup.mutate({
              UserPoolId: POOL_ID,
              GroupName: 'ToDelete',
            })
          }}
        >
          Delete
        </button>
        {deleteGroup.isSuccess && <span data-testid="success">deleted</span>}
      </div>
    )
  }

  it('deletes a group via mutation', async () => {
    groupStore.create(POOL_ID, { GroupName: 'ToDelete' })

    const user = userEvent.setup()
    renderWithProviders(<DeleteHarness />)

    await user.click(screen.getByText('Delete'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })

    expect(() => groupStore.describe(POOL_ID, 'ToDelete')).toThrow()
  })
})
