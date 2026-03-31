import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test-utils'
import { userStore } from '../../../mocks/stores/userStore'
import {
  useAdminGetUser,
  useAdminUpdateUserAttributes,
  useAdminDeleteUserAttributes,
} from '../../../api/hooks/useUsers'
import { useTranslation } from 'react-i18next'

const POOL_ID = 'us-east-1_TestPool'
const USERNAME = 'testuser'

// ── Overview Tab Test Harness ──────────────────────────────────────

function OverviewTestHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const { t } = useTranslation('users')
  const { data, isLoading, isError } = useAdminGetUser(userPoolId, username)

  if (isLoading) return <div>{t('detail.loading')}</div>
  if (isError || !data) return <div>{t('detail.notFound')}</div>

  const email = data.UserAttributes?.find((a) => a.Name === 'email')?.Value ?? '—'
  const emailVerified = data.UserAttributes?.find((a) => a.Name === 'email_verified')?.Value === 'true'

  return (
    <div>
      <h1>{data.Username}</h1>
      <span data-testid="status">{data.UserStatus}</span>
      <span data-testid="enabled">{data.Enabled === true ? 'Enabled' : 'Disabled'}</span>
      <span data-testid="email">{email}</span>
      <span data-testid="email-verified">{emailVerified ? 'Yes' : 'No'}</span>
      <span data-testid="sub">
        {data.UserAttributes?.find((a) => a.Name === 'sub')?.Value ?? '—'}
      </span>
    </div>
  )
}

describe('User Overview', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('shows loading state initially', () => {
    userStore.create(POOL_ID, { Username: USERNAME })
    renderWithProviders(<OverviewTestHarness userPoolId={POOL_ID} username={USERNAME} />)
    expect(screen.getByText('Loading user...')).toBeInTheDocument()
  })

  it('renders user metadata from MSW', async () => {
    userStore.create(POOL_ID, {
      Username: USERNAME,
      UserAttributes: [
        { Name: 'sub', Value: 'test-sub-123' },
        { Name: 'email', Value: 'test@example.com' },
        { Name: 'email_verified', Value: 'true' },
      ],
    })
    userStore.confirmSignUp(POOL_ID, USERNAME)

    renderWithProviders(<OverviewTestHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByText(USERNAME)).toBeInTheDocument()
    })

    expect(screen.getByTestId('status')).toHaveTextContent('CONFIRMED')
    expect(screen.getByTestId('enabled')).toHaveTextContent('Enabled')
    expect(screen.getByTestId('email')).toHaveTextContent('test@example.com')
    expect(screen.getByTestId('email-verified')).toHaveTextContent('Yes')
    expect(screen.getByTestId('sub')).toHaveTextContent('test-sub-123')
  })

  it('shows disabled state correctly', async () => {
    userStore.create(POOL_ID, { Username: USERNAME })
    userStore.disableUser(POOL_ID, USERNAME)

    renderWithProviders(<OverviewTestHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('enabled')).toHaveTextContent('Disabled')
    })
  })

  it('shows not found for non-existent user', async () => {
    renderWithProviders(<OverviewTestHarness userPoolId={POOL_ID} username="nonexistent" />)

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument()
    })
  })
})

// ── Attributes Tab Test Harness ────────────────────────────────────

function AttributesTestHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const { t } = useTranslation('users')
  const { data, isLoading, isError } = useAdminGetUser(userPoolId, username)
  const updateAttributes = useAdminUpdateUserAttributes()
  const deleteAttributes = useAdminDeleteUserAttributes()

  if (isLoading) return <div>{t('detail.loading')}</div>
  if (isError || !data) return <div>{t('detail.notFound')}</div>

  const attributes = data.UserAttributes ?? []

  return (
    <div>
      <h2>{t('detail.attributes.title')}</h2>
      {attributes.length === 0 ? (
        <div>{t('detail.attributes.empty')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('detail.attributes.name')}</th>
              <th>{t('detail.attributes.value')}</th>
              <th>{t('detail.attributes.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {attributes.map((attr) => (
              <tr key={attr.Name}>
                <td>{attr.Name}</td>
                <td data-testid={`attr-value-${attr.Name ?? ''}`}>{attr.Value}</td>
                <td>
                  {attr.Name !== 'sub' && attr.Name !== 'identities' && (
                    <button
                      type="button"
                      data-testid={`edit-${attr.Name ?? ''}`}
                      onClick={() => {
                        updateAttributes.mutate({
                          UserPoolId: userPoolId,
                          Username: username,
                          UserAttributes: [{ Name: attr.Name, Value: 'updated-value' }],
                        })
                      }}
                    >
                      {t('detail.attributes.editButton')}
                    </button>
                  )}
                  {attr.Name?.startsWith('custom:') === true && (
                    <button
                      type="button"
                      data-testid={`delete-${attr.Name}`}
                      onClick={() => {
                        deleteAttributes.mutate({
                          UserPoolId: userPoolId,
                          Username: username,
                          UserAttributeNames: [attr.Name ?? ''],
                        })
                      }}
                    >
                      {t('detail.attributes.deleteButton')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <span data-testid="update-status">
        {updateAttributes.isSuccess ? 'updated' : updateAttributes.isPending ? 'updating' : 'idle'}
      </span>
      <span data-testid="delete-status">
        {deleteAttributes.isSuccess ? 'deleted' : deleteAttributes.isPending ? 'deleting' : 'idle'}
      </span>
    </div>
  )
}

describe('User Attributes', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('renders user attributes', async () => {
    userStore.create(POOL_ID, {
      Username: USERNAME,
      UserAttributes: [
        { Name: 'sub', Value: 'sub-123' },
        { Name: 'email', Value: 'test@example.com' },
        { Name: 'custom:role', Value: 'admin' },
      ],
    })

    renderWithProviders(<AttributesTestHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByText('sub')).toBeInTheDocument()
      expect(screen.getByText('email')).toBeInTheDocument()
      expect(screen.getByText('custom:role')).toBeInTheDocument()
    })

    expect(screen.getByTestId('attr-value-email')).toHaveTextContent('test@example.com')
    expect(screen.getByTestId('attr-value-custom:role')).toHaveTextContent('admin')
  })

  it('shows edit button for mutable attributes', async () => {
    userStore.create(POOL_ID, {
      Username: USERNAME,
      UserAttributes: [
        { Name: 'sub', Value: 'sub-123' },
        { Name: 'email', Value: 'test@example.com' },
      ],
    })

    renderWithProviders(<AttributesTestHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('edit-email')).toBeInTheDocument()
    })

    // sub is immutable — no edit button
    expect(screen.queryByTestId('edit-sub')).not.toBeInTheDocument()
  })

  it('shows delete button only for custom attributes', async () => {
    userStore.create(POOL_ID, {
      Username: USERNAME,
      UserAttributes: [
        { Name: 'sub', Value: 'sub-123' },
        { Name: 'email', Value: 'test@example.com' },
        { Name: 'custom:role', Value: 'admin' },
      ],
    })

    renderWithProviders(<AttributesTestHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-custom:role')).toBeInTheDocument()
    })

    // Standard attributes should not have a delete button
    expect(screen.queryByTestId('delete-email')).not.toBeInTheDocument()
    expect(screen.queryByTestId('delete-sub')).not.toBeInTheDocument()
  })

  it('can update user attributes via MSW', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, {
      Username: USERNAME,
      UserAttributes: [
        { Name: 'sub', Value: 'sub-123' },
        { Name: 'email', Value: 'old@example.com' },
      ],
    })

    renderWithProviders(<AttributesTestHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('edit-email')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('edit-email'))

    await waitFor(() => {
      expect(screen.getByTestId('update-status')).toHaveTextContent('updated')
    })

    // Verify the store was updated
    const updated = userStore.getUser(POOL_ID, USERNAME)
    const emailAttr = updated.Attributes?.find((a) => a.Name === 'email')
    expect(emailAttr?.Value).toBe('updated-value')
  })

  it('can delete custom attributes via MSW', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, {
      Username: USERNAME,
      UserAttributes: [
        { Name: 'sub', Value: 'sub-123' },
        { Name: 'email', Value: 'test@example.com' },
        { Name: 'custom:role', Value: 'admin' },
      ],
    })

    renderWithProviders(<AttributesTestHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-custom:role')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('delete-custom:role'))

    await waitFor(() => {
      expect(screen.getByTestId('delete-status')).toHaveTextContent('deleted')
    })

    // Verify the store was updated
    const updated = userStore.getUser(POOL_ID, USERNAME)
    const customAttr = updated.Attributes?.find((a) => a.Name === 'custom:role')
    expect(customAttr).toBeUndefined()
  })
})

// ── Hook integration tests ─────────────────────────────────────────

function GetUserHookHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const { data, isLoading, isError } = useAdminGetUser(userPoolId, username)

  return (
    <div>
      {isLoading && <span data-testid="loading">loading</span>}
      {isError && <span data-testid="error">error</span>}
      {data && (
        <>
          <span data-testid="username">{data.Username}</span>
          <span data-testid="attr-count">{data.UserAttributes?.length ?? 0}</span>
        </>
      )}
    </div>
  )
}

describe('useAdminGetUser hook', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('fetches a single user', async () => {
    userStore.create(POOL_ID, {
      Username: USERNAME,
      UserAttributes: [
        { Name: 'sub', Value: 'abc' },
        { Name: 'email', Value: 'test@test.com' },
      ],
    })

    renderWithProviders(<GetUserHookHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent(USERNAME)
    })
    expect(screen.getByTestId('attr-count')).toHaveTextContent('2')
  })

  it('returns error for non-existent user', async () => {
    renderWithProviders(<GetUserHookHarness userPoolId={POOL_ID} username="ghost" />)

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument()
    })
  })
})
