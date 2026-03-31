import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test-utils'
import { userStore } from '../../../mocks/stores/userStore'
import {
  useAdminListGroupsForUser,
  useAdminAddUserToGroup,
  useAdminRemoveUserFromGroup,
} from '../../../api/hooks/useUsers'
import { useTranslation } from 'react-i18next'

const POOL_ID = 'us-east-1_TestPool'
const USERNAME = 'testuser'

// ── Groups Tab Test Harness ──────────────────────────────────────

function GroupsHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const { t } = useTranslation('users')
  const groupsQuery = useAdminListGroupsForUser({ UserPoolId: userPoolId, Username: username })
  const addToGroup = useAdminAddUserToGroup()
  const removeFromGroup = useAdminRemoveUserFromGroup()

  const groups = groupsQuery.data?.Groups ?? []

  return (
    <div>
      {groupsQuery.isLoading && <span data-testid="loading">loading</span>}
      <span data-testid="group-count">{groups.length}</span>
      <ul>
        {groups.map((g) => (
          <li key={g.GroupName} data-testid={`group-${g.GroupName ?? ''}`}>
            {g.GroupName}
            <button
              type="button"
              data-testid={`remove-${g.GroupName ?? ''}`}
              onClick={() => {
                removeFromGroup.mutate({
                  UserPoolId: userPoolId,
                  Username: username,
                  GroupName: g.GroupName ?? '',
                })
              }}
            >
              {t('detail.groups.removeButton')}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        data-testid="add-group-btn"
        onClick={() => {
          addToGroup.mutate({
            UserPoolId: userPoolId,
            Username: username,
            GroupName: 'NewGroup',
          })
        }}
      >
        {t('detail.groups.addButton')}
      </button>
      <span data-testid="add-status">
        {addToGroup.isSuccess ? 'added' : addToGroup.isPending ? 'adding' : 'idle'}
      </span>
      <span data-testid="remove-status">
        {removeFromGroup.isSuccess ? 'removed' : removeFromGroup.isPending ? 'removing' : 'idle'}
      </span>
    </div>
  )
}

describe('GroupsTab', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('renders empty state when user has no groups', async () => {
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<GroupsHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('group-count')).toHaveTextContent('0')
    })
  })

  it('renders group memberships', async () => {
    userStore.create(POOL_ID, { Username: USERNAME })
    userStore.addToGroup(POOL_ID, USERNAME, 'Admins')
    userStore.addToGroup(POOL_ID, USERNAME, 'Developers')

    renderWithProviders(<GroupsHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('group-count')).toHaveTextContent('2')
    })

    expect(screen.getByTestId('group-Admins')).toBeInTheDocument()
    expect(screen.getByTestId('group-Developers')).toBeInTheDocument()
  })

  it('can add user to a group via MSW', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<GroupsHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('group-count')).toHaveTextContent('0')
    })

    await user.click(screen.getByTestId('add-group-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('add-status')).toHaveTextContent('added')
    })

    // Verify the store was updated
    const groups = userStore.listGroupsForUser(POOL_ID, USERNAME)
    expect(groups).toHaveLength(1)
    expect(groups[0]?.GroupName).toBe('NewGroup')
  })

  it('can remove user from a group via MSW', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })
    userStore.addToGroup(POOL_ID, USERNAME, 'Admins')

    renderWithProviders(<GroupsHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('group-Admins')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('remove-Admins'))

    await waitFor(() => {
      expect(screen.getByTestId('remove-status')).toHaveTextContent('removed')
    })

    // Verify the store was updated
    const groups = userStore.listGroupsForUser(POOL_ID, USERNAME)
    expect(groups).toHaveLength(0)
  })
})
