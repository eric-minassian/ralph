import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test-utils'
import { userStore } from '../../../mocks/stores/userStore'
import {
  useAdminGetUser,
  useAdminEnableUser,
  useAdminDisableUser,
  useAdminResetUserPassword,
  useAdminSetUserPassword,
  useAdminConfirmSignUp,
  useAdminUserGlobalSignOut,
  useAdminDeleteUser,
} from '../../../api/hooks/useUsers'
import { useTranslation } from 'react-i18next'

const POOL_ID = 'us-east-1_TestPool'
const USERNAME = 'actionuser'

// ── Harness for action mutation testing ───────────────────────────

function EnableDisableHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const { t } = useTranslation('users')
  const { data, isLoading } = useAdminGetUser(userPoolId, username)
  const enableUser = useAdminEnableUser()
  const disableUser = useAdminDisableUser()

  if (isLoading || !data) return <div>{t('detail.loading')}</div>

  return (
    <div>
      <span data-testid="enabled">{data.Enabled === true ? 'true' : 'false'}</span>
      <button
        type="button"
        data-testid="enable-btn"
        onClick={() => { enableUser.mutate({ UserPoolId: userPoolId, Username: username }) }}
      >
        Enable
      </button>
      <button
        type="button"
        data-testid="disable-btn"
        onClick={() => { disableUser.mutate({ UserPoolId: userPoolId, Username: username }) }}
      >
        Disable
      </button>
      <span data-testid="enable-status">
        {enableUser.isSuccess ? 'done' : enableUser.isPending ? 'pending' : 'idle'}
      </span>
      <span data-testid="disable-status">
        {disableUser.isSuccess ? 'done' : disableUser.isPending ? 'pending' : 'idle'}
      </span>
    </div>
  )
}

function ResetPasswordHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const { data, isLoading } = useAdminGetUser(userPoolId, username)
  const resetPassword = useAdminResetUserPassword()

  if (isLoading || !data) return <div>Loading...</div>

  return (
    <div>
      <span data-testid="status">{data.UserStatus}</span>
      <button
        type="button"
        data-testid="reset-btn"
        onClick={() => { resetPassword.mutate({ UserPoolId: userPoolId, Username: username }) }}
      >
        Reset
      </button>
      <span data-testid="reset-status">
        {resetPassword.isSuccess ? 'done' : resetPassword.isPending ? 'pending' : 'idle'}
      </span>
    </div>
  )
}

function SetPasswordHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const { data, isLoading } = useAdminGetUser(userPoolId, username)
  const setPassword = useAdminSetUserPassword()

  if (isLoading || !data) return <div>Loading...</div>

  return (
    <div>
      <span data-testid="status">{data.UserStatus}</span>
      <button
        type="button"
        data-testid="setpw-btn"
        onClick={() => {
          setPassword.mutate({
            UserPoolId: userPoolId,
            Username: username,
            Password: 'NewPass123!',
            Permanent: true,
          })
        }}
      >
        Set Password
      </button>
      <span data-testid="setpw-status">
        {setPassword.isSuccess ? 'done' : setPassword.isPending ? 'pending' : 'idle'}
      </span>
    </div>
  )
}

function ConfirmSignUpHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const { data, isLoading } = useAdminGetUser(userPoolId, username)
  const confirmSignUp = useAdminConfirmSignUp()

  if (isLoading || !data) return <div>Loading...</div>

  return (
    <div>
      <span data-testid="status">{data.UserStatus}</span>
      <button
        type="button"
        data-testid="confirm-btn"
        onClick={() => { confirmSignUp.mutate({ UserPoolId: userPoolId, Username: username }) }}
      >
        Confirm
      </button>
      <span data-testid="confirm-status">
        {confirmSignUp.isSuccess ? 'done' : confirmSignUp.isPending ? 'pending' : 'idle'}
      </span>
    </div>
  )
}

function GlobalSignOutHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const globalSignOut = useAdminUserGlobalSignOut()

  return (
    <div>
      <button
        type="button"
        data-testid="signout-btn"
        onClick={() => { globalSignOut.mutate({ UserPoolId: userPoolId, Username: username }) }}
      >
        Sign Out
      </button>
      <span data-testid="signout-status">
        {globalSignOut.isSuccess ? 'done' : globalSignOut.isPending ? 'pending' : 'idle'}
      </span>
    </div>
  )
}

function DeleteUserHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const deleteUser = useAdminDeleteUser()

  return (
    <div>
      <button
        type="button"
        data-testid="delete-btn"
        onClick={() => { deleteUser.mutate({ UserPoolId: userPoolId, Username: username }) }}
      >
        Delete
      </button>
      <span data-testid="delete-status">
        {deleteUser.isSuccess ? 'done' : deleteUser.isPending ? 'pending' : 'idle'}
      </span>
    </div>
  )
}

// ── Tests ──────────────────────────────────────────────────────────

describe('User Actions — Enable/Disable', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('enables a disabled user via MSW', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })
    userStore.disableUser(POOL_ID, USERNAME)

    renderWithProviders(<EnableDisableHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('enabled')).toHaveTextContent('false')
    })

    await user.click(screen.getByTestId('enable-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('enable-status')).toHaveTextContent('done')
    })

    const stored = userStore.getUser(POOL_ID, USERNAME)
    expect(stored.Enabled).toBe(true)
  })

  it('disables an enabled user via MSW', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<EnableDisableHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('enabled')).toHaveTextContent('true')
    })

    await user.click(screen.getByTestId('disable-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('disable-status')).toHaveTextContent('done')
    })

    const stored = userStore.getUser(POOL_ID, USERNAME)
    expect(stored.Enabled).toBe(false)
  })
})

describe('User Actions — Reset Password', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('resets password and sets status to RESET_REQUIRED', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })
    userStore.confirmSignUp(POOL_ID, USERNAME)

    renderWithProviders(<ResetPasswordHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('CONFIRMED')
    })

    await user.click(screen.getByTestId('reset-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('reset-status')).toHaveTextContent('done')
    })

    const stored = userStore.getUser(POOL_ID, USERNAME)
    expect(stored.UserStatus).toBe('RESET_REQUIRED')
  })
})

describe('User Actions — Set Password', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('sets permanent password and changes status to CONFIRMED', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<SetPasswordHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('FORCE_CHANGE_PASSWORD')
    })

    await user.click(screen.getByTestId('setpw-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('setpw-status')).toHaveTextContent('done')
    })

    const stored = userStore.getUser(POOL_ID, USERNAME)
    expect(stored.UserStatus).toBe('CONFIRMED')
  })
})

describe('User Actions — Confirm Sign-up', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('confirms sign-up and sets status to CONFIRMED', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<ConfirmSignUpHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('FORCE_CHANGE_PASSWORD')
    })

    await user.click(screen.getByTestId('confirm-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('confirm-status')).toHaveTextContent('done')
    })

    const stored = userStore.getUser(POOL_ID, USERNAME)
    expect(stored.UserStatus).toBe('CONFIRMED')
  })
})

describe('User Actions — Global Sign-out', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('signs out user globally', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<GlobalSignOutHarness userPoolId={POOL_ID} username={USERNAME} />)

    await user.click(screen.getByTestId('signout-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('signout-status')).toHaveTextContent('done')
    })
  })
})

describe('User Actions — Delete', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('deletes user from store', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<DeleteUserHarness userPoolId={POOL_ID} username={USERNAME} />)

    await user.click(screen.getByTestId('delete-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('delete-status')).toHaveTextContent('done')
    })

    expect(() => userStore.getUser(POOL_ID, USERNAME)).toThrow()
  })
})
