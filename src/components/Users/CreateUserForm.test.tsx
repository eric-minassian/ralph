import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test-utils'
import { userStore } from '../../mocks/stores/userStore'
import { userPoolStore } from '../../mocks/stores/userPoolStore'
import { useAdminCreateUser } from '../../api/hooks/useUsers'
import { useDescribeUserPool } from '../../api/hooks/useUserPools'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

const POOL_ID = 'us-east-1_CreateTest'

/**
 * A test harness that exercises the CreateUserForm hooks and logic
 * without requiring TanStack Router context.
 */
function CreateUserFormTestHarness() {
  const { t } = useTranslation('users')
  const createUser = useAdminCreateUser()
  const { data: poolData } = useDescribeUserPool(POOL_ID)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [autoGenPassword, setAutoGenPassword] = useState(true)
  const [suppressMessage, setSuppressMessage] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState('')

  const customAttributes = (poolData?.UserPool?.SchemaAttributes ?? []).filter(
    (attr) => typeof attr.Name === 'string' && attr.Name.startsWith('custom:'),
  )
  const [customValues, setCustomValues] = useState<Record<string, string>>({})

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (username.trim().length === 0) {
      errs.username = t('validation:required')
    } else if (username.trim().length > 128) {
      errs.username = t('validation:maxLength', { max: '128' })
    }
    if (!autoGenPassword && password.length > 0 && password.length < 8) {
      errs.temporaryPassword = t('validation:minLength', { min: '8' })
    }
    if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = t('validation:invalidEmail')
    }
    if (phone.length > 0 && !/^\+[1-9]\d{1,14}$/.test(phone)) {
      errs.phone = t('validation:invalidPhone')
    }
    return errs
  }

  const handleSubmit = () => {
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const userAttributes: { Name: string; Value: string }[] = []
    if (email.length > 0) userAttributes.push({ Name: 'email', Value: email })
    if (phone.length > 0) userAttributes.push({ Name: 'phone_number', Value: phone })

    for (const attr of customAttributes) {
      const val = attr.Name ? customValues[attr.Name] : undefined
      if (typeof val === 'string' && val.length > 0 && typeof attr.Name === 'string') {
        userAttributes.push({ Name: attr.Name, Value: val })
      }
    }

    createUser.mutate(
      {
        UserPoolId: POOL_ID,
        Username: username.trim(),
        TemporaryPassword: autoGenPassword ? undefined : password.length > 0 ? password : undefined,
        UserAttributes: userAttributes.length > 0 ? userAttributes : undefined,
        MessageAction: suppressMessage ? 'SUPPRESS' : undefined,
      },
      {
        onSuccess: () => {
          setResult('success')
        },
        onError: () => {
          setResult('error')
        },
      },
    )
  }

  return (
    <div>
      <h1>{t('create.title')}</h1>

      <label>
        {t('create.username')}
        <input
          data-testid="username"
          value={username}
          onChange={(e) => { setUsername(e.target.value) }}
        />
      </label>
      {errors.username !== undefined && <span data-testid="error-username">{errors.username}</span>}

      <label>
        <input
          type="checkbox"
          data-testid="auto-gen-password"
          checked={autoGenPassword}
          onChange={(e) => { setAutoGenPassword(e.target.checked) }}
        />
        {t('create.autoGeneratePassword')}
      </label>

      {!autoGenPassword && (
        <label>
          {t('create.temporaryPassword')}
          <input
            data-testid="password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value) }}
          />
        </label>
      )}
      {errors.temporaryPassword !== undefined && (
        <span data-testid="error-password">{errors.temporaryPassword}</span>
      )}

      <label>
        {t('create.email')}
        <input
          data-testid="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value) }}
        />
      </label>
      {errors.email !== undefined && <span data-testid="error-email">{errors.email}</span>}

      <label>
        {t('create.phone')}
        <input
          data-testid="phone"
          value={phone}
          onChange={(e) => { setPhone(e.target.value) }}
        />
      </label>
      {errors.phone !== undefined && <span data-testid="error-phone">{errors.phone}</span>}

      <label>
        <input
          type="checkbox"
          data-testid="suppress-message"
          checked={suppressMessage}
          onChange={(e) => { setSuppressMessage(e.target.checked) }}
        />
        {t('create.suppressMessage')}
      </label>

      {customAttributes.map((attr) => {
        const attrName = attr.Name
        if (typeof attrName !== 'string') return null
        return (
          <label key={attrName}>
            {attrName}
            <input
              data-testid={`custom-${attrName}`}
              value={customValues[attrName] ?? ''}
              onChange={(e) => {
                setCustomValues((prev) => ({ ...prev, [attrName]: e.target.value }))
              }}
            />
          </label>
        )
      })}

      <button data-testid="submit" onClick={handleSubmit}>
        {t('create.submitButton')}
      </button>

      {createUser.isPending && <span data-testid="loading">loading</span>}
      {result.length > 0 && <span data-testid="result">{result}</span>}
    </div>
  )
}

describe('CreateUserForm validation', () => {
  beforeEach(() => {
    userStore.clear()
    userPoolStore.clear()
    userPoolStore.create({
      PoolName: 'TestPool',
    })
  })

  it('shows required error when username is empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateUserFormTestHarness />)

    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(screen.getByTestId('error-username')).toHaveTextContent('This field is required')
    })
  })

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateUserFormTestHarness />)

    await user.type(screen.getByTestId('username'), 'testuser')
    await user.type(screen.getByTestId('email'), 'invalid-email')
    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(screen.getByTestId('error-email')).toHaveTextContent('Please enter a valid email address')
    })
  })

  it('shows error for invalid phone format', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateUserFormTestHarness />)

    await user.type(screen.getByTestId('username'), 'testuser')
    await user.type(screen.getByTestId('phone'), '1234567890')
    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(screen.getByTestId('error-phone')).toHaveTextContent('Please enter a valid phone number')
    })
  })

  it('shows error for short temporary password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateUserFormTestHarness />)

    await user.type(screen.getByTestId('username'), 'testuser')
    await user.click(screen.getByTestId('auto-gen-password'))

    await waitFor(() => {
      expect(screen.getByTestId('password')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('password'), 'short')
    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(screen.getByTestId('error-password')).toHaveTextContent('Must be at least 8 characters')
    })
  })

  it('accepts valid email format', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateUserFormTestHarness />)

    await user.type(screen.getByTestId('username'), 'testuser')
    await user.type(screen.getByTestId('email'), 'valid@example.com')
    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(screen.queryByTestId('error-email')).not.toBeInTheDocument()
    })
  })

  it('accepts valid phone format', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateUserFormTestHarness />)

    await user.type(screen.getByTestId('username'), 'testuser')
    await user.type(screen.getByTestId('phone'), '+12065551234')
    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(screen.queryByTestId('error-phone')).not.toBeInTheDocument()
    })
  })
})

describe('CreateUserForm integration', () => {
  beforeEach(() => {
    userStore.clear()
    userPoolStore.clear()
    userPoolStore.create({
      PoolName: 'IntegrationPool',
    })
  })

  it('creates a user with username only', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateUserFormTestHarness />)

    await user.type(screen.getByTestId('username'), 'newuser')
    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('success')
    })
  })

  it('creates a user with email and phone attributes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateUserFormTestHarness />)

    await user.type(screen.getByTestId('username'), 'attruser')
    await user.type(screen.getByTestId('email'), 'attr@example.com')
    await user.type(screen.getByTestId('phone'), '+14155551234')
    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('success')
    })
  })

  it('creates a user with suppress message action', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateUserFormTestHarness />)

    await user.type(screen.getByTestId('username'), 'suppressuser')
    await user.click(screen.getByTestId('suppress-message'))
    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('success')
    })
  })

  it('shows error when creating duplicate user', async () => {
    userStore.create(POOL_ID, { Username: 'existing' })

    const user = userEvent.setup()
    renderWithProviders(<CreateUserFormTestHarness />)

    await user.type(screen.getByTestId('username'), 'existing')
    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('error')
    })
  })

  it('renders the create form heading', () => {
    renderWithProviders(<CreateUserFormTestHarness />)
    const elements = screen.getAllByText('Create user')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })

  it('hides password input when auto-generate is on', () => {
    renderWithProviders(<CreateUserFormTestHarness />)
    expect(screen.queryByTestId('password')).not.toBeInTheDocument()
  })

  it('shows password input when auto-generate is off', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateUserFormTestHarness />)

    await user.click(screen.getByTestId('auto-gen-password'))

    await waitFor(() => {
      expect(screen.getByTestId('password')).toBeInTheDocument()
    })
  })
})
