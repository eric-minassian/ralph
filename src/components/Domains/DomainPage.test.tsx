import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test-utils'
import { DomainPage } from './DomainPage'
import { domainStore } from '../../mocks/stores/domainStore'
import { userPoolStore } from '../../mocks/stores/userPoolStore'

let poolId = ''

function createTestPool(): string {
  userPoolStore.clear()
  const pool = userPoolStore.create({ PoolName: 'DomainTestPool' })
  return pool.Id ?? ''
}

function TestDomainPage() {
  return <DomainPage userPoolId={poolId} />
}

describe('DomainPage', () => {
  beforeEach(() => {
    domainStore.clear()
    poolId = createTestPool()
  })

  it('shows no domain state when pool has no domain', async () => {
    await renderWithRouter(TestDomainPage)

    await waitFor(() => {
      expect(screen.getByText('No domain configured')).toBeInTheDocument()
    })
  })

  it('shows create button when no domain exists', async () => {
    await renderWithRouter(TestDomainPage)

    await waitFor(() => {
      expect(screen.getByText('Create domain')).toBeInTheDocument()
    })
  })

  it('shows create form when create button is clicked', async () => {
    const user = userEvent.setup()

    await renderWithRouter(TestDomainPage)

    await waitFor(() => {
      expect(screen.getByText('Create domain')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Create domain'))

    await waitFor(() => {
      expect(screen.getByText('Add domain')).toBeInTheDocument()
    })
  })

  it('shows domain detail when domain exists', async () => {
    domainStore.create(poolId, { Domain: 'test-prefix', UserPoolId: poolId })
    userPoolStore.setDomain(poolId, 'test-prefix', false)

    await renderWithRouter(TestDomainPage)

    await waitFor(() => {
      expect(screen.getByText('Domain: test-prefix')).toBeInTheDocument()
    })
  })

  it('shows prefix domain URL', async () => {
    domainStore.create(poolId, { Domain: 'my-auth', UserPoolId: poolId })
    userPoolStore.setDomain(poolId, 'my-auth', false)

    await renderWithRouter(TestDomainPage)

    await waitFor(() => {
      expect(screen.getByText(/my-auth\.auth\..+\.amazoncognito\.com/)).toBeInTheDocument()
    })
  })

  it('shows status indicator for active domain', async () => {
    domainStore.create(poolId, { Domain: 'status-test', UserPoolId: poolId })
    userPoolStore.setDomain(poolId, 'status-test', false)

    await renderWithRouter(TestDomainPage)

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  it('validates prefix format on submit', async () => {
    const user = userEvent.setup()

    await renderWithRouter(TestDomainPage)

    await waitFor(() => {
      expect(screen.getByText('Create domain')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Create domain'))

    await waitFor(() => {
      expect(screen.getByText('Add domain')).toBeInTheDocument()
    })

    // Click the submit button without entering prefix
    const submitButtons = screen.getAllByRole('button')
    const submitButton = submitButtons.find((b) => b.textContent.includes('Create domain'))
    expect(submitButton).toBeDefined()
    if (submitButton) {
      await user.click(submitButton)
    }

    await waitFor(() => {
      expect(screen.getByText('Domain prefix is required')).toBeInTheDocument()
    })
  })

  it('shows delete confirmation modal', async () => {
    const user = userEvent.setup()

    domainStore.create(poolId, { Domain: 'delete-me', UserPoolId: poolId })
    userPoolStore.setDomain(poolId, 'delete-me', false)

    await renderWithRouter(TestDomainPage)

    await waitFor(() => {
      expect(screen.getByText('Domain: delete-me')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /Delete domain/i })
    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
    })
  })

  it('shows custom domain details with CloudFront', async () => {
    domainStore.create(poolId, {
      Domain: 'auth.example.com',
      UserPoolId: poolId,
      CustomDomainConfig: {
        CertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/abc',
      },
    })
    userPoolStore.setDomain(poolId, 'auth.example.com', true)

    await renderWithRouter(TestDomainPage)

    await waitFor(() => {
      expect(screen.getByText('Domain: auth.example.com')).toBeInTheDocument()
    })

    expect(screen.getByText('Custom domain')).toBeInTheDocument()
    expect(screen.getByText(/cloudfront\.net/)).toBeInTheDocument()
  })

  it('creates a prefix domain via form', async () => {
    const user = userEvent.setup()

    await renderWithRouter(TestDomainPage)

    await waitFor(() => {
      expect(screen.getByText('Create domain')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Create domain'))

    await waitFor(() => {
      expect(screen.getByText('Add domain')).toBeInTheDocument()
    })

    const prefixInput = screen.getByPlaceholderText('my-app')
    await user.type(prefixInput, 'my-test-prefix')

    const submitButtons = screen.getAllByRole('button')
    const submitButton = submitButtons.find((b) => b.textContent.includes('Create domain'))
    if (submitButton) {
      await user.click(submitButton)
    }

    await waitFor(() => {
      const domain = domainStore.describe('my-test-prefix')
      expect(domain.Domain).toBe('my-test-prefix')
    })
  })
})
