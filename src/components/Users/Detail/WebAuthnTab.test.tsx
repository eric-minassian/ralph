import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test-utils'
import { userStore } from '../../../mocks/stores/userStore'
import {
  useListWebAuthnCredentials,
  useDeleteWebAuthnCredential,
} from '../../../api/hooks/useUsers'
import { useTranslation } from 'react-i18next'

const POOL_ID = 'us-east-1_TestPool'
const USERNAME = 'testuser'

// ── WebAuthn Tab Test Harness ──────────────────────────────────────

function WebAuthnHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const { t } = useTranslation('webauthn')
  const credentialsQuery = useListWebAuthnCredentials(userPoolId, username)
  const deleteCredential = useDeleteWebAuthnCredential()

  const credentials = credentialsQuery.data?.Credentials ?? []

  return (
    <div>
      {credentialsQuery.isLoading && <span data-testid="loading">loading</span>}
      <span data-testid="credential-count">{credentials.length}</span>
      <ul>
        {credentials.map((c) => (
          <li key={c.CredentialId} data-testid={`credential-${c.CredentialId ?? ''}`}>
            <span data-testid={`name-${c.CredentialId ?? ''}`}>{c.FriendlyCredentialName}</span>
            <span data-testid={`rp-${c.CredentialId ?? ''}`}>{c.RelyingPartyId}</span>
            <button
              type="button"
              data-testid={`delete-${c.CredentialId ?? ''}`}
              onClick={() => {
                deleteCredential.mutate({
                  userPoolId,
                  username,
                  credentialId: c.CredentialId ?? '',
                })
              }}
            >
              {t('deleteButton')}
            </button>
          </li>
        ))}
      </ul>
      <span data-testid="delete-status">
        {deleteCredential.isSuccess ? 'deleted' : deleteCredential.isPending ? 'deleting' : 'idle'}
      </span>
    </div>
  )
}

describe('WebAuthnTab', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('renders seed WebAuthn credentials for a user', async () => {
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<WebAuthnHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('credential-count')).toHaveTextContent('2')
    })
  })

  it('can delete a WebAuthn credential via MSW', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<WebAuthnHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('credential-count')).toHaveTextContent('2')
    })

    // Get the first credential ID from the store
    const credsBefore = userStore.listWebAuthnCredentials(POOL_ID, USERNAME)
    const firstCredId = credsBefore.Credentials[0]?.CredentialId ?? ''

    await user.click(screen.getByTestId(`delete-${firstCredId}`))

    await waitFor(() => {
      expect(screen.getByTestId('delete-status')).toHaveTextContent('deleted')
    })

    // Verify store was updated
    const credsAfter = userStore.listWebAuthnCredentials(POOL_ID, USERNAME)
    expect(credsAfter.Credentials).toHaveLength(1)
  })

  it('renders empty state when user has no credentials', async () => {
    userStore.create(POOL_ID, { Username: USERNAME })
    // Delete all seed credentials
    const allCreds = userStore.listWebAuthnCredentials(POOL_ID, USERNAME)
    for (const c of allCreds.Credentials) {
      userStore.deleteWebAuthnCredential(POOL_ID, USERNAME, c.CredentialId ?? '')
    }

    renderWithProviders(<WebAuthnHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('credential-count')).toHaveTextContent('0')
    })
  })

  it('shows credential details', async () => {
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<WebAuthnHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('credential-count')).toHaveTextContent('2')
    })

    const creds = userStore.listWebAuthnCredentials(POOL_ID, USERNAME)
    const firstCred = creds.Credentials[0]
    const firstCredId = firstCred?.CredentialId ?? ''

    expect(screen.getByTestId(`name-${firstCredId}`)).toHaveTextContent(firstCred?.FriendlyCredentialName ?? '')
    expect(screen.getByTestId(`rp-${firstCredId}`)).toHaveTextContent('cognito.example.com')
  })
})
