import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Form from '@cloudscape-design/components/form'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Container from '@cloudscape-design/components/container'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Button from '@cloudscape-design/components/button'
import Toggle from '@cloudscape-design/components/toggle'
import Checkbox from '@cloudscape-design/components/checkbox'
import type { SchemaAttributeType } from '@aws-sdk/client-cognito-identity-provider'
import { useAdminCreateUser } from '../../api/hooks/useUsers'
import { useDescribeUserPool } from '../../api/hooks/useUserPools'
import { useNotifications } from '../../hooks/useNotifications'

// ── Form state ──────────────────────────────────────────────────────

interface FormState {
  username: string
  temporaryPassword: string
  autoGeneratePassword: boolean
  email: string
  phone: string
  name: string
  customAttributeValues: Record<string, string>
  suppressMessage: boolean
}

const DEFAULT_FORM_STATE: FormState = {
  username: '',
  temporaryPassword: '',
  autoGeneratePassword: true,
  email: '',
  phone: '',
  name: '',
  customAttributeValues: {},
  suppressMessage: false,
}

interface FormErrors {
  [key: string]: string | undefined
}

// ── Validation ──────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/

interface ValidationErrorKeys {
  username?: 'required' | 'maxLength'
  temporaryPassword?: 'minLength'
  email?: 'invalidEmail'
  phone?: 'invalidPhone'
}

function validateForm(state: FormState): ValidationErrorKeys {
  const errors: ValidationErrorKeys = {}
  const trimmedUsername = state.username.trim()

  if (trimmedUsername.length === 0) {
    errors.username = 'required'
  } else if (trimmedUsername.length > 128) {
    errors.username = 'maxLength'
  }

  if (!state.autoGeneratePassword && state.temporaryPassword.length > 0) {
    if (state.temporaryPassword.length < 8) {
      errors.temporaryPassword = 'minLength'
    }
  }

  if (state.email.length > 0 && !EMAIL_REGEX.test(state.email)) {
    errors.email = 'invalidEmail'
  }

  if (state.phone.length > 0 && !PHONE_REGEX.test(state.phone)) {
    errors.phone = 'invalidPhone'
  }

  return errors
}

function translateErrors(
  keys: ValidationErrorKeys,
  t: (key: string, opts?: Record<string, string>) => string,
): FormErrors {
  const errors: FormErrors = {}
  if (keys.username === 'required') errors.username = t('validation:required')
  if (keys.username === 'maxLength') errors.username = t('validation:maxLength', { max: '128' })
  if (keys.temporaryPassword === 'minLength') errors.temporaryPassword = t('validation:minLength', { min: '8' })
  if (keys.email === 'invalidEmail') errors.email = t('validation:invalidEmail')
  if (keys.phone === 'invalidPhone') errors.phone = t('validation:invalidPhone')
  return errors
}

function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some((v) => v !== undefined)
}

// ── Component ───────────────────────────────────────────────────────

interface CreateUserFormProps {
  userPoolId: string
}

export function CreateUserForm({ userPoolId }: CreateUserFormProps) {
  const { t } = useTranslation('users')
  const navigate = useNavigate()
  const createUser = useAdminCreateUser()
  const { addNotification } = useNotifications()
  const { data: poolData } = useDescribeUserPool(userPoolId)

  const [formState, setFormState] = useState(DEFAULT_FORM_STATE)
  const [errors, setErrors] = useState<FormErrors>({})

  const customAttributes = useMemo(() => {
    const schema = poolData?.UserPool?.SchemaAttributes ?? []
    return schema.filter(
      (attr): attr is SchemaAttributeType & { Name: string } =>
        typeof attr.Name === 'string' && attr.Name.startsWith('custom:'),
    )
  }, [poolData])

  const handleSubmit = () => {
    const errorKeys = validateForm(formState)
    const translatedErrors = translateErrors(errorKeys, (key, opts) => t(key, opts ?? {}))
    setErrors(translatedErrors)
    if (hasErrors(translatedErrors)) return

    const userAttributes: { Name: string; Value: string }[] = []
    if (formState.email.length > 0) {
      userAttributes.push({ Name: 'email', Value: formState.email })
    }
    if (formState.phone.length > 0) {
      userAttributes.push({ Name: 'phone_number', Value: formState.phone })
    }
    if (formState.name.length > 0) {
      userAttributes.push({ Name: 'name', Value: formState.name })
    }

    for (const attr of customAttributes) {
      const value = formState.customAttributeValues[attr.Name]
      if (typeof value === 'string' && value.length > 0) {
        userAttributes.push({ Name: attr.Name, Value: value })
      }
    }

    createUser.mutate(
      {
        UserPoolId: userPoolId,
        Username: formState.username.trim(),
        TemporaryPassword: formState.autoGeneratePassword
          ? undefined
          : formState.temporaryPassword.length > 0
            ? formState.temporaryPassword
            : undefined,
        UserAttributes: userAttributes.length > 0 ? userAttributes : undefined,
        MessageAction: formState.suppressMessage ? 'SUPPRESS' : undefined,
      },
      {
        onSuccess: () => {
          addNotification({
            id: `create-user-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.createSuccess', {
              username: formState.username.trim(),
            }),
            dismissible: true,
          })
          void navigate({
            to: '/user-pools/$userPoolId/users',
            params: { userPoolId },
          })
        },
        onError: () => {
          addNotification({
            id: `create-user-error-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.createError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleCancel = () => {
    void navigate({
      to: '/user-pools/$userPoolId/users',
      params: { userPoolId },
    })
  }

  return (
    <Form
      header={
        <Header variant="h1" description={t('create.description')}>
          {t('create.title')}
        </Header>
      }
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={handleCancel}>
            {t('create.cancelButton')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={createUser.isPending}
          >
            {t('create.submitButton')}
          </Button>
        </SpaceBetween>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        <Container header={<Header variant="h2">{t('create.title')}</Header>}>
          <SpaceBetween direction="vertical" size="l">
            <FormField
              label={t('create.username')}
              constraintText={t('create.usernameConstraint')}
              errorText={errors.username}
            >
              <Input
                value={formState.username}
                placeholder={t('create.usernamePlaceholder')}
                onChange={({ detail }) => {
                  setFormState((prev) => ({ ...prev, username: detail.value }))
                }}
              />
            </FormField>

            <FormField label={t('create.temporaryPassword')} errorText={errors.temporaryPassword}>
              <SpaceBetween direction="vertical" size="s">
                <Toggle
                  checked={formState.autoGeneratePassword}
                  onChange={({ detail }) => {
                    setFormState((prev) => ({
                      ...prev,
                      autoGeneratePassword: detail.checked,
                      temporaryPassword: detail.checked ? '' : prev.temporaryPassword,
                    }))
                  }}
                >
                  {t('create.autoGeneratePassword')}
                </Toggle>
                {!formState.autoGeneratePassword && (
                  <Input
                    value={formState.temporaryPassword}
                    type="password"
                    placeholder={t('create.temporaryPasswordPlaceholder')}
                    onChange={({ detail }) => {
                      setFormState((prev) => ({
                        ...prev,
                        temporaryPassword: detail.value,
                      }))
                    }}
                  />
                )}
              </SpaceBetween>
            </FormField>

            <FormField label={t('create.email')} errorText={errors.email}>
              <Input
                value={formState.email}
                placeholder={t('create.emailPlaceholder')}
                inputMode="email"
                onChange={({ detail }) => {
                  setFormState((prev) => ({ ...prev, email: detail.value }))
                }}
              />
            </FormField>

            <FormField
              label={t('create.phone')}
              constraintText={t('create.phoneConstraint')}
              errorText={errors.phone}
            >
              <Input
                value={formState.phone}
                placeholder={t('create.phonePlaceholder')}
                inputMode="tel"
                onChange={({ detail }) => {
                  setFormState((prev) => ({ ...prev, phone: detail.value }))
                }}
              />
            </FormField>

            <FormField label={t('create.name')}>
              <Input
                value={formState.name}
                placeholder={t('create.namePlaceholder')}
                onChange={({ detail }) => {
                  setFormState((prev) => ({ ...prev, name: detail.value }))
                }}
              />
            </FormField>
          </SpaceBetween>
        </Container>

        {customAttributes.length > 0 && (
          <Container
            header={<Header variant="h2">{t('create.customAttributes')}</Header>}
          >
            <SpaceBetween direction="vertical" size="l">
              {customAttributes.map((attr) => (
                <FormField key={attr.Name} label={attr.Name}>
                  <Input
                    value={formState.customAttributeValues[attr.Name] ?? ''}
                    placeholder={t('create.customAttributeValuePlaceholder')}
                    onChange={({ detail }) => {
                      setFormState((prev) => ({
                        ...prev,
                        customAttributeValues: {
                          ...prev.customAttributeValues,
                          [attr.Name]: detail.value,
                        },
                      }))
                    }}
                  />
                </FormField>
              ))}
            </SpaceBetween>
          </Container>
        )}

        <Container
          header={
            <Header variant="h2">{t('create.sendInvitation')}</Header>
          }
        >
          <Checkbox
            checked={formState.suppressMessage}
            description={t('create.suppressMessageDescription')}
            onChange={({ detail }) => {
              setFormState((prev) => ({
                ...prev,
                suppressMessage: detail.checked,
              }))
            }}
          >
            {t('create.suppressMessage')}
          </Checkbox>
        </Container>
      </SpaceBetween>
    </Form>
  )
}
