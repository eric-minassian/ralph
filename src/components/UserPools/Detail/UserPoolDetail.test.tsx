import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserPoolMfaType } from '@aws-sdk/client-cognito-identity-provider'
import { renderWithProviders } from '../../../test-utils'
import { userPoolStore } from '../../../mocks/stores/userPoolStore'
import {
  useDescribeUserPool,
  useGetUserPoolMfaConfig,
  useDeleteUserPool,
  useSetUserPoolMfaConfig,
  useAddCustomAttributes,
} from '../../../api/hooks/useUserPools'
import { useTranslation } from 'react-i18next'
import { NotificationProvider } from '../../../contexts/NotificationProvider'

// ── Test harness: renders detail sections without router context ─────

function DetailTestHarness({ userPoolId }: { userPoolId: string }) {
  const { t } = useTranslation('userPools')
  const { data, isLoading, isError } = useDescribeUserPool(userPoolId)
  const mfaConfig = useGetUserPoolMfaConfig(userPoolId)

  if (isLoading) return <div>{t('detail.loading')}</div>
  if (isError || !data?.UserPool) return <div>{t('detail.notFound')}</div>

  const userPool = data.UserPool
  const policy = userPool.Policies?.PasswordPolicy

  return (
    <NotificationProvider>
      <div>
        <h1>{t('detail.title', { name: userPool.Name ?? '' })}</h1>

        {/* General section */}
        <section data-testid="general-section">
          <h2>{t('detail.general.title')}</h2>
          <span data-testid="pool-name">{userPool.Name}</span>
          <span data-testid="pool-id">{userPool.Id}</span>
        </section>

        {/* Sign-in section */}
        <section data-testid="signin-section">
          <h2>{t('detail.signIn.title')}</h2>
          <span data-testid="sign-in-options">
            {(userPool.UsernameAttributes ?? []).length > 0
              ? (userPool.UsernameAttributes ?? []).join(', ')
              : 'username'}
          </span>
        </section>

        {/* Password policy section */}
        <section data-testid="password-section">
          <h2>{t('detail.passwordPolicy.title')}</h2>
          <span data-testid="min-length">{String(policy?.MinimumLength ?? 8)}</span>
          <span data-testid="require-uppercase">
            {policy?.RequireUppercase === true ? 'Yes' : 'No'}
          </span>
        </section>

        {/* MFA section */}
        <section data-testid="mfa-section">
          <h2>{t('detail.mfa.title')}</h2>
          <span data-testid="mfa-mode">{mfaConfig.data?.MfaConfiguration ?? 'OFF'}</span>
        </section>

        {/* Custom attributes section */}
        <section data-testid="custom-attrs-section">
          <h2>{t('detail.customAttributes.title')}</h2>
          {(userPool.SchemaAttributes ?? [])
            .filter((a) => a.Name?.startsWith('custom:') === true)
            .map((a) => (
              <span key={a.Name} data-testid="custom-attr">
                {a.Name}
              </span>
            ))}
        </section>

        {/* Deletion protection section */}
        <section data-testid="deletion-protection-section">
          <h2>{t('detail.deletionProtection.title')}</h2>
          <span data-testid="deletion-protection">
            {userPool.DeletionProtection === 'ACTIVE' ? 'Active' : 'Inactive'}
          </span>
        </section>
      </div>
    </NotificationProvider>
  )
}

describe('UserPoolDetail — sections display', () => {
  beforeEach(() => {
    userPoolStore.clear()
  })

  it('shows loading state initially', () => {
    userPoolStore.create({ PoolName: 'LoadingPool' })
    renderWithProviders(<DetailTestHarness userPoolId="us-east-1_nonexistent" />)
    expect(screen.getByText('Loading user pool...')).toBeInTheDocument()
  })

  it('shows not-found for invalid pool ID', async () => {
    renderWithProviders(<DetailTestHarness userPoolId="invalid-id" />)
    await waitFor(() => {
      expect(screen.getByText('User pool not found')).toBeInTheDocument()
    })
  })

  it('renders general section with pool name and ID', async () => {
    const pool = userPoolStore.create({ PoolName: 'DetailTestPool' })
    const poolId = pool.Id ?? ''

    renderWithProviders(<DetailTestHarness userPoolId={poolId} />)

    await waitFor(() => {
      expect(screen.getByTestId('pool-name')).toHaveTextContent('DetailTestPool')
      expect(screen.getByTestId('pool-id')).toHaveTextContent(poolId)
    })
  })

  it('renders sign-in section with default username', async () => {
    const pool = userPoolStore.create({ PoolName: 'SignInPool' })

    renderWithProviders(<DetailTestHarness userPoolId={pool.Id ?? ''} />)

    await waitFor(() => {
      expect(screen.getByTestId('sign-in-options')).toHaveTextContent('username')
    })
  })

  it('renders password policy section', async () => {
    const pool = userPoolStore.create({ PoolName: 'PasswordPool' })

    renderWithProviders(<DetailTestHarness userPoolId={pool.Id ?? ''} />)

    await waitFor(() => {
      expect(screen.getByTestId('min-length')).toHaveTextContent('8')
      expect(screen.getByTestId('require-uppercase')).toHaveTextContent('Yes')
    })
  })

  it('renders MFA section with default OFF mode', async () => {
    const pool = userPoolStore.create({ PoolName: 'MfaPool' })

    renderWithProviders(<DetailTestHarness userPoolId={pool.Id ?? ''} />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-mode')).toHaveTextContent('OFF')
    })
  })

  it('renders deletion protection status', async () => {
    const pool = userPoolStore.create({
      PoolName: 'ProtectedPool',
      DeletionProtection: 'ACTIVE',
    })

    renderWithProviders(<DetailTestHarness userPoolId={pool.Id ?? ''} />)

    await waitFor(() => {
      expect(screen.getByTestId('deletion-protection')).toHaveTextContent('Active')
    })
  })

  it('renders unprotected pool as inactive', async () => {
    const pool = userPoolStore.create({
      PoolName: 'UnprotectedPool',
      DeletionProtection: 'INACTIVE',
    })

    renderWithProviders(<DetailTestHarness userPoolId={pool.Id ?? ''} />)

    await waitFor(() => {
      expect(screen.getByTestId('deletion-protection')).toHaveTextContent('Inactive')
    })
  })

  it('shows empty custom attributes when none defined', async () => {
    const pool = userPoolStore.create({ PoolName: 'NoCustomPool' })

    renderWithProviders(<DetailTestHarness userPoolId={pool.Id ?? ''} />)

    await waitFor(() => {
      expect(screen.getByTestId('custom-attrs-section')).toBeInTheDocument()
      expect(screen.queryAllByTestId('custom-attr')).toHaveLength(0)
    })
  })
})

// ── MFA edit flow ───────────────────────────────────────────────────

function MfaEditTestHarness({ userPoolId }: { userPoolId: string }) {
  const { t } = useTranslation('userPools')
  const mfaConfig = useGetUserPoolMfaConfig(userPoolId)
  const setMfaConfig = useSetUserPoolMfaConfig()

  const handleSetMfa = (mode: UserPoolMfaType) => {
    setMfaConfig.mutate({
      UserPoolId: userPoolId,
      MfaConfiguration: mode,
      SoftwareTokenMfaConfiguration: { Enabled: true },
    })
  }

  return (
    <div>
      <span data-testid="mfa-mode">{mfaConfig.data?.MfaConfiguration ?? 'loading'}</span>
      <button
        type="button"
        data-testid="set-optional"
        onClick={() => { handleSetMfa('OPTIONAL') }}
      >
        {t('detail.mfa.mfaOptional')}
      </button>
      <button
        type="button"
        data-testid="set-required"
        onClick={() => { handleSetMfa('ON') }}
      >
        {t('detail.mfa.mfaRequired')}
      </button>
      {setMfaConfig.isSuccess && <span data-testid="mfa-saved">saved</span>}
    </div>
  )
}

describe('MFA configuration edit', () => {
  beforeEach(() => {
    userPoolStore.clear()
  })

  it('can set MFA to OPTIONAL', async () => {
    const pool = userPoolStore.create({ PoolName: 'MfaEditPool' })
    const user = userEvent.setup()

    renderWithProviders(<MfaEditTestHarness userPoolId={pool.Id ?? ''} />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-mode')).toHaveTextContent('OFF')
    })

    await user.click(screen.getByTestId('set-optional'))

    await waitFor(() => {
      expect(screen.getByTestId('mfa-saved')).toBeInTheDocument()
    })
  })

  it('can set MFA to ON (required)', async () => {
    const pool = userPoolStore.create({ PoolName: 'MfaRequiredPool' })
    const user = userEvent.setup()

    renderWithProviders(<MfaEditTestHarness userPoolId={pool.Id ?? ''} />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-mode')).toHaveTextContent('OFF')
    })

    await user.click(screen.getByTestId('set-required'))

    await waitFor(() => {
      expect(screen.getByTestId('mfa-saved')).toBeInTheDocument()
    })
  })
})

// ── Delete flow ─────────────────────────────────────────────────────

function DeleteTestHarness({ userPoolId }: { userPoolId: string }) {
  const { t } = useTranslation('userPools')
  const { data } = useDescribeUserPool(userPoolId)
  const deletePool = useDeleteUserPool()

  const handleDelete = () => {
    deletePool.mutate({ UserPoolId: userPoolId })
  }

  return (
    <div>
      <span data-testid="pool-name">{data?.UserPool?.Name ?? 'loading'}</span>
      <button type="button" data-testid="delete-btn" onClick={handleDelete}>
        {t('detail.delete.deleteButton')}
      </button>
      {deletePool.isSuccess && <span data-testid="deleted">deleted</span>}
      {deletePool.isError && <span data-testid="delete-error">error</span>}
    </div>
  )
}

describe('Delete user pool', () => {
  beforeEach(() => {
    userPoolStore.clear()
  })

  it('can delete an unprotected pool', async () => {
    const pool = userPoolStore.create({
      PoolName: 'DeleteMe',
      DeletionProtection: 'INACTIVE',
    })
    const user = userEvent.setup()

    renderWithProviders(<DeleteTestHarness userPoolId={pool.Id ?? ''} />)

    await waitFor(() => {
      expect(screen.getByTestId('pool-name')).toHaveTextContent('DeleteMe')
    })

    await user.click(screen.getByTestId('delete-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('deleted')).toBeInTheDocument()
    })
  })

  it('fails to delete a protected pool', async () => {
    const pool = userPoolStore.create({
      PoolName: 'ProtectedDelete',
      DeletionProtection: 'ACTIVE',
    })
    const user = userEvent.setup()

    renderWithProviders(<DeleteTestHarness userPoolId={pool.Id ?? ''} />)

    await waitFor(() => {
      expect(screen.getByTestId('pool-name')).toHaveTextContent('ProtectedDelete')
    })

    await user.click(screen.getByTestId('delete-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('delete-error')).toBeInTheDocument()
    })
  })
})

// ── Add custom attributes flow ──────────────────────────────────────

function AddAttrTestHarness({ userPoolId }: { userPoolId: string }) {
  const { t } = useTranslation('userPools')
  const { data, refetch } = useDescribeUserPool(userPoolId)
  const addAttr = useAddCustomAttributes()

  const handleAdd = () => {
    addAttr.mutate(
      {
        UserPoolId: userPoolId,
        CustomAttributes: [
          { Name: 'myCustomAttr', AttributeDataType: 'String', Mutable: true },
        ],
      },
      {
        onSuccess: () => {
          void refetch()
        },
      },
    )
  }

  const customAttrs = (data?.UserPool?.SchemaAttributes ?? []).filter(
    (a) => a.Name?.startsWith('custom:') === true,
  )

  return (
    <div>
      <span data-testid="attr-count">{String(customAttrs.length)}</span>
      {customAttrs.map((a) => (
        <span key={a.Name} data-testid="custom-attr">{a.Name}</span>
      ))}
      <button type="button" data-testid="add-attr-btn" onClick={handleAdd}>
        {t('detail.customAttributes.addButton')}
      </button>
      {addAttr.isSuccess && <span data-testid="attr-added">added</span>}
    </div>
  )
}

describe('Add custom attributes', () => {
  beforeEach(() => {
    userPoolStore.clear()
  })

  it('can add a custom attribute', async () => {
    const pool = userPoolStore.create({ PoolName: 'AttrPool' })
    const user = userEvent.setup()

    renderWithProviders(<AddAttrTestHarness userPoolId={pool.Id ?? ''} />)

    await waitFor(() => {
      expect(screen.getByTestId('attr-count')).toHaveTextContent('0')
    })

    await user.click(screen.getByTestId('add-attr-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('attr-added')).toBeInTheDocument()
    })
  })
})
