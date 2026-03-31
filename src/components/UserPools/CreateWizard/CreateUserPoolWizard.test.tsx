import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test-utils'
import { NotificationProvider } from '../../../contexts/NotificationProvider'
import { userPoolStore } from '../../../mocks/stores/userPoolStore'
import { CreateUserPoolWizard } from './CreateUserPoolWizard'

// Mock TanStack Router hooks so the wizard renders without a real router
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual: typeof import('@tanstack/react-router') = await importOriginal()
  const mockNavigate = (): Promise<void> => Promise.resolve()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderWizard() {
  return renderWithProviders(
    <NotificationProvider>
      <CreateUserPoolWizard />
    </NotificationProvider>,
  )
}

/**
 * Helper: Cloudscape Wizard duplicates step titles in multiple DOM nodes
 * (nav link + step header + container header). Use getAllByText for step titles.
 */
function expectStepVisible(title: string) {
  const matches = screen.getAllByText(title)
  expect(matches.length).toBeGreaterThan(0)
}

async function fillPoolNameAndAdvance(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.type(screen.getByPlaceholderText('Enter pool name'), name)
  await user.click(screen.getByRole('button', { name: /next/i }))
}

async function clickNext(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /next/i }))
}

describe('CreateUserPoolWizard', () => {
  beforeEach(() => {
    userPoolStore.clear()
  })

  it('renders the first step with pool name field', () => {
    renderWizard()

    expectStepVisible('Configure pool settings')
    expect(screen.getByText('Pool name')).toBeInTheDocument()
  })

  it('blocks navigation when pool name is empty', async () => {
    const user = userEvent.setup()
    renderWizard()

    await clickNext(user)

    // Wizard should stay on step 1 — verify by checking pool name input is still visible
    expect(screen.getByPlaceholderText('Enter pool name')).toBeInTheDocument()
    // Step 2 content should NOT be visible
    expect(screen.queryByText('Sign-in options')).not.toBeInTheDocument()
  })

  it('advances to step 2 when pool name is valid', async () => {
    const user = userEvent.setup()
    renderWizard()

    await fillPoolNameAndAdvance(user, 'TestPool')

    expectStepVisible('Configure sign-in')
  })

  it('validates sign-in step requires at least one option', async () => {
    const user = userEvent.setup()
    renderWizard()

    await fillPoolNameAndAdvance(user, 'TestPool')

    // Uncheck default username option
    const usernameCheckbox = screen.getByLabelText('Username')
    await user.click(usernameCheckbox)

    await clickNext(user)

    await waitFor(() => {
      expect(screen.getByText('Select at least one sign-in option')).toBeInTheDocument()
    })
  })

  it('navigates through all steps to review', async () => {
    const user = userEvent.setup()
    renderWizard()

    // Step 1
    await fillPoolNameAndAdvance(user, 'ReviewTestPool')

    // Step 2
    expectStepVisible('Configure sign-in')
    await clickNext(user)

    // Step 3
    expectStepVisible('Configure security')
    await clickNext(user)

    // Step 4
    expectStepVisible('Configure delivery')
    await clickNext(user)

    // Step 5: review — pool name is shown as a value
    expectStepVisible('Review and create')
    expect(screen.getByText('ReviewTestPool')).toBeInTheDocument()
  })

  it('validates security step for invalid min length', async () => {
    const user = userEvent.setup()
    renderWizard()

    // Step 1
    await fillPoolNameAndAdvance(user, 'SecurityTest')

    // Step 2
    await clickNext(user)

    // Step 3: we need to set min length to a value < 8
    // The input shows "8". We need to triple-click to select all then type
    const minLengthInput = screen.getByDisplayValue('8')
    await user.tripleClick(minLengthInput)
    await user.keyboard('5')

    await clickNext(user)

    await waitFor(() => {
      expect(
        screen.getByText('Minimum length must be between 8 and 99'),
      ).toBeInTheDocument()
    })
  })

  it('validates MFA methods when MFA is enabled', async () => {
    const user = userEvent.setup()
    renderWizard()

    // Step 1
    await fillPoolNameAndAdvance(user, 'MFATest')

    // Step 2
    await clickNext(user)

    // Step 3: enable optional MFA but don't select a method
    const optionalRadio = screen.getByLabelText(
      /optional/i,
    )
    await user.click(optionalRadio)

    await clickNext(user)

    await waitFor(() => {
      expect(
        screen.getByText('Select at least one MFA method when MFA is enabled'),
      ).toBeInTheDocument()
    })
  })

  it('submits the wizard and creates a user pool via MSW', async () => {
    const user = userEvent.setup()
    renderWizard()

    // Step 1
    await fillPoolNameAndAdvance(user, 'MSWCreatedPool')

    // Step 2
    await clickNext(user)

    // Step 3
    await clickNext(user)

    // Step 4
    await clickNext(user)

    // Step 5: Submit
    const submitButton = screen.getByRole('button', { name: /create user pool/i })
    await user.click(submitButton)

    // Verify the pool was created in the MSW store
    await waitFor(() => {
      const pools = userPoolStore.list(10)
      expect(pools.UserPools).toHaveLength(1)
      expect(pools.UserPools[0]?.Name).toBe('MSWCreatedPool')
    })
  })

  it('can navigate back to previous steps', async () => {
    const user = userEvent.setup()
    renderWizard()

    // Step 1: fill and advance
    await fillPoolNameAndAdvance(user, 'BackNavPool')

    // Step 2: go back
    expectStepVisible('Configure sign-in')
    await user.click(screen.getByRole('button', { name: /previous/i }))

    // Should be back on step 1 with data preserved
    expectStepVisible('Configure pool settings')
    expect(screen.getByDisplayValue('BackNavPool')).toBeInTheDocument()
  })

  it('review step shows edit buttons', async () => {
    const user = userEvent.setup()
    renderWizard()

    // Navigate to review step
    await fillPoolNameAndAdvance(user, 'EditNavPool')
    await clickNext(user)
    await clickNext(user)
    await clickNext(user)

    // Verify review is showing
    expectStepVisible('Review and create')

    // There should be 4 Edit buttons (one for each section)
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    expect(editButtons.length).toBe(4)

    // Click the first Edit button (Pool settings section)
    const firstEditButton = editButtons[0]
    if (firstEditButton === undefined) throw new Error('Expected edit button')
    await user.click(firstEditButton)

    // Should navigate back to step 1
    expectStepVisible('Configure pool settings')
    expect(screen.getByDisplayValue('EditNavPool')).toBeInTheDocument()
  })
})
