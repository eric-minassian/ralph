import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test-utils'
import { userStore } from '../../../mocks/stores/userStore'
import {
  useAdminLinkProviderForUser,
  useAdminDisableProviderForUser,
} from '../../../api/hooks/useUsers'
import { useTranslation } from 'react-i18next'

const POOL_ID = 'us-east-1_TestPool'
const USERNAME = 'testuser'

// ── Linked Providers Test Harness ──────────────────────────────────

function ProvidersHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const { t } = useTranslation('users')
  const linkProvider = useAdminLinkProviderForUser()
  const unlinkProvider = useAdminDisableProviderForUser()

  const providers = userStore.listLinkedProviders(userPoolId, username)

  return (
    <div>
      <span data-testid="provider-count">{providers.length}</span>
      <ul>
        {providers.map((p) => (
          <li key={`${p.ProviderName}-${p.ProviderAttributeValue}`} data-testid={`provider-${p.ProviderName}`}>
            {p.ProviderName}: {p.ProviderAttributeValue}
            <button
              type="button"
              data-testid={`unlink-${p.ProviderName}`}
              onClick={() => {
                unlinkProvider.mutate({
                  UserPoolId: userPoolId,
                  User: {
                    ProviderName: p.ProviderName,
                    ProviderAttributeName: p.ProviderAttributeName,
                    ProviderAttributeValue: p.ProviderAttributeValue,
                  },
                })
              }}
            >
              {t('detail.linkedProviders.unlinkButton')}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        data-testid="link-btn"
        onClick={() => {
          linkProvider.mutate({
            UserPoolId: userPoolId,
            DestinationUser: {
              ProviderName: 'Cognito',
              ProviderAttributeName: 'Username',
              ProviderAttributeValue: username,
            },
            SourceUser: {
              ProviderName: 'Google',
              ProviderAttributeName: 'Cognito_Subject',
              ProviderAttributeValue: 'google-user-123',
            },
          })
        }}
      >
        {t('detail.linkedProviders.linkButton')}
      </button>
      <span data-testid="link-status">
        {linkProvider.isSuccess ? 'linked' : linkProvider.isPending ? 'linking' : 'idle'}
      </span>
      <span data-testid="unlink-status">
        {unlinkProvider.isSuccess ? 'unlinked' : unlinkProvider.isPending ? 'unlinking' : 'idle'}
      </span>
    </div>
  )
}

describe('LinkedProvidersTab', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('renders empty state when user has no linked providers', () => {
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<ProvidersHarness userPoolId={POOL_ID} username={USERNAME} />)

    expect(screen.getByTestId('provider-count')).toHaveTextContent('0')
  })

  it('renders linked providers', () => {
    userStore.create(POOL_ID, { Username: USERNAME })
    userStore.linkProvider(POOL_ID, USERNAME, {
      ProviderName: 'Google',
      ProviderAttributeName: 'Cognito_Subject',
      ProviderAttributeValue: 'google-123',
    })
    userStore.linkProvider(POOL_ID, USERNAME, {
      ProviderName: 'Facebook',
      ProviderAttributeName: 'Cognito_Subject',
      ProviderAttributeValue: 'fb-456',
    })

    renderWithProviders(<ProvidersHarness userPoolId={POOL_ID} username={USERNAME} />)

    expect(screen.getByTestId('provider-count')).toHaveTextContent('2')
    expect(screen.getByTestId('provider-Google')).toBeInTheDocument()
    expect(screen.getByTestId('provider-Facebook')).toBeInTheDocument()
  })

  it('can link a provider via MSW', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<ProvidersHarness userPoolId={POOL_ID} username={USERNAME} />)

    await user.click(screen.getByTestId('link-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('link-status')).toHaveTextContent('linked')
    })

    // Verify the store was updated
    const providers = userStore.listLinkedProviders(POOL_ID, USERNAME)
    expect(providers).toHaveLength(1)
    expect(providers[0]?.ProviderName).toBe('Google')
    expect(providers[0]?.ProviderAttributeValue).toBe('google-user-123')
  })

  it('can unlink a provider via MSW', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })
    userStore.linkProvider(POOL_ID, USERNAME, {
      ProviderName: 'Google',
      ProviderAttributeName: 'Cognito_Subject',
      ProviderAttributeValue: 'google-123',
    })

    renderWithProviders(<ProvidersHarness userPoolId={POOL_ID} username={USERNAME} />)

    expect(screen.getByTestId('provider-Google')).toBeInTheDocument()

    await user.click(screen.getByTestId('unlink-Google'))

    await waitFor(() => {
      expect(screen.getByTestId('unlink-status')).toHaveTextContent('unlinked')
    })

    // Verify the store was updated
    const providers = userStore.listLinkedProviders(POOL_ID, USERNAME)
    expect(providers).toHaveLength(0)
  })

  it('does not create duplicate provider links', () => {
    userStore.create(POOL_ID, { Username: USERNAME })
    userStore.linkProvider(POOL_ID, USERNAME, {
      ProviderName: 'Google',
      ProviderAttributeName: 'Cognito_Subject',
      ProviderAttributeValue: 'google-123',
    })
    // Link same provider again
    userStore.linkProvider(POOL_ID, USERNAME, {
      ProviderName: 'Google',
      ProviderAttributeName: 'Cognito_Subject',
      ProviderAttributeValue: 'google-123',
    })

    const providers = userStore.listLinkedProviders(POOL_ID, USERNAME)
    expect(providers).toHaveLength(1)
  })
})
