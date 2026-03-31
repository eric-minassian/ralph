import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Form from '@cloudscape-design/components/form'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Checkbox from '@cloudscape-design/components/checkbox'
import Toggle from '@cloudscape-design/components/toggle'
import Textarea from '@cloudscape-design/components/textarea'
import Select from '@cloudscape-design/components/select'
import Button from '@cloudscape-design/components/button'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Header from '@cloudscape-design/components/header'
import Container from '@cloudscape-design/components/container'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import type { ExplicitAuthFlowsType, OAuthFlowType, TimeUnitsType } from '@aws-sdk/client-cognito-identity-provider'
import { useCreateAppClient } from '../../../../api/hooks/useAppClients'
import { useNotifications } from '../../../../hooks/useNotifications'

const VALID_TIME_UNITS: Set<string> = new Set(['days', 'hours', 'minutes', 'seconds'])

function isTimeUnit(value: string): value is TimeUnitsType {
  return VALID_TIME_UNITS.has(value)
}

function toTimeUnit(value: string): TimeUnitsType {
  if (isTimeUnit(value)) return value
  return 'hours'
}

const VALID_OAUTH_FLOWS: Set<string> = new Set(['code', 'implicit', 'client_credentials'])

function isOAuthFlow(value: string): value is OAuthFlowType {
  return VALID_OAUTH_FLOWS.has(value)
}

function toOAuthFlows(arr: string[]): OAuthFlowType[] {
  return arr.filter(isOAuthFlow)
}

export const Route = createFileRoute('/user-pools/$userPoolId/app-clients/create')({
  component: CreateAppClientPage,
})

const AUTH_FLOW_OPTIONS: Array<{ value: ExplicitAuthFlowsType; labelKey: string }> = [
  { value: 'ALLOW_USER_SRP_AUTH', labelKey: 'detail.authFlows.ALLOW_USER_SRP_AUTH' },
  { value: 'ALLOW_USER_PASSWORD_AUTH', labelKey: 'detail.authFlows.ALLOW_USER_PASSWORD_AUTH' },
  { value: 'ALLOW_REFRESH_TOKEN_AUTH', labelKey: 'detail.authFlows.ALLOW_REFRESH_TOKEN_AUTH' },
  { value: 'ALLOW_CUSTOM_AUTH', labelKey: 'detail.authFlows.ALLOW_CUSTOM_AUTH' },
  { value: 'ALLOW_ADMIN_USER_PASSWORD_AUTH', labelKey: 'detail.authFlows.ALLOW_ADMIN_USER_PASSWORD_AUTH' },
  { value: 'ALLOW_USER_AUTH', labelKey: 'detail.authFlows.ALLOW_USER_AUTH' },
]

const TOKEN_UNIT_OPTIONS = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
]

function CreateAppClientPage() {
  const { t } = useTranslation('appClients')
  const navigate = useNavigate()
  const { userPoolId } = Route.useParams()
  const { addNotification } = useNotifications()
  const createAppClient = useCreateAppClient()

  const [clientName, setClientName] = useState('')
  const [clientNameError, setClientNameError] = useState('')
  const [generateSecret, setGenerateSecret] = useState(false)
  const [authFlows, setAuthFlows] = useState<Set<ExplicitAuthFlowsType>>(new Set(['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH']))
  const [oauthEnabled, setOauthEnabled] = useState(false)
  const [allowedOAuthFlows, setAllowedOAuthFlows] = useState(new Set<string>())
  const [allowedOAuthScopes, setAllowedOAuthScopes] = useState('')
  const [callbackUrls, setCallbackUrls] = useState('')
  const [logoutUrls, setLogoutUrls] = useState('')
  const [callbackUrlsError, setCallbackUrlsError] = useState('')
  const [accessTokenValidity, setAccessTokenValidity] = useState('1')
  const [accessTokenUnit, setAccessTokenUnit] = useState('hours')
  const [idTokenValidity, setIdTokenValidity] = useState('1')
  const [idTokenUnit, setIdTokenUnit] = useState('hours')
  const [refreshTokenValidity, setRefreshTokenValidity] = useState('30')
  const [refreshTokenUnit, setRefreshTokenUnit] = useState('days')
  const [preventUserExistenceErrors, setPreventUserExistenceErrors] = useState(true)
  const [enableTokenRevocation, setEnableTokenRevocation] = useState(true)

  const toggleAuthFlow = (flow: ExplicitAuthFlowsType, checked: boolean) => {
    const next = new Set(authFlows)
    if (checked) {
      next.add(flow)
    } else {
      next.delete(flow)
    }
    setAuthFlows(next)
  }

  const toggleOAuthFlow = (flow: string, checked: boolean) => {
    const next = new Set(allowedOAuthFlows)
    if (checked) {
      next.add(flow)
    } else {
      next.delete(flow)
    }
    setAllowedOAuthFlows(next)
  }

  const parseUrls = (text: string): string[] => {
    return text
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  const handleSubmit = () => {
    setClientNameError('')
    setCallbackUrlsError('')

    if (clientName.trim().length === 0) {
      setClientNameError(t('create.validation.clientNameRequired'))
      return
    }

    const parsedCallbackUrls = parseUrls(callbackUrls)
    if (oauthEnabled && parsedCallbackUrls.length > 0) {
      const invalid = parsedCallbackUrls.some((url) => {
        try {
          new URL(url)
          return false
        } catch {
          return true
        }
      })
      if (invalid) {
        setCallbackUrlsError(t('create.validation.callbackUrlInvalid'))
        return
      }
    }

    const input: Parameters<typeof createAppClient.mutate>[0] = {
      UserPoolId: userPoolId,
      ClientName: clientName.trim(),
      GenerateSecret: generateSecret,
      ExplicitAuthFlows: [...authFlows],
      AccessTokenValidity: parseInt(accessTokenValidity, 10) || 1,
      IdTokenValidity: parseInt(idTokenValidity, 10) || 1,
      RefreshTokenValidity: parseInt(refreshTokenValidity, 10) || 30,
      TokenValidityUnits: {
        AccessToken: toTimeUnit(accessTokenUnit),
        IdToken: toTimeUnit(idTokenUnit),
        RefreshToken: toTimeUnit(refreshTokenUnit),
      },
      PreventUserExistenceErrors: preventUserExistenceErrors ? 'ENABLED' : 'LEGACY',
      EnableTokenRevocation: enableTokenRevocation,
    }

    if (oauthEnabled) {
      input.AllowedOAuthFlowsUserPoolClient = true
      input.AllowedOAuthFlows = toOAuthFlows([...allowedOAuthFlows])
      const scopes = allowedOAuthScopes.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      if (scopes.length > 0) {
        input.AllowedOAuthScopes = scopes
      }
      if (parsedCallbackUrls.length > 0) {
        input.CallbackURLs = parsedCallbackUrls
      }
      const parsedLogoutUrls = parseUrls(logoutUrls)
      if (parsedLogoutUrls.length > 0) {
        input.LogoutURLs = parsedLogoutUrls
      }
    }

    createAppClient.mutate(
      input,
      {
        onSuccess: (result) => {
          const newClientId = result.UserPoolClient?.ClientId ?? ''
          addNotification({
            id: `create-client-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.createSuccess', { name: clientName.trim() }),
            dismissible: true,
          })
          void navigate({
            to: '/user-pools/$userPoolId/app-clients/$clientId',
            params: { userPoolId, clientId: newClientId },
          })
        },
        onError: () => {
          addNotification({
            id: `create-client-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.createError'),
            dismissible: true,
          })
        },
      },
    )
  }

  return (
    <Form
      header={<Header variant="h1">{t('create.title')}</Header>}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            variant="link"
            onClick={() => {
              void navigate({
                to: '/user-pools/$userPoolId/app-clients',
                params: { userPoolId },
              })
            }}
          >
            {t('create.form.cancelButton')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={createAppClient.isPending}
          >
            {t('create.form.createButton')}
          </Button>
        </SpaceBetween>
      }
    >
      <SpaceBetween size="l">
        {/* General */}
        <Container header={<Header variant="h2">{t('detail.general.title')}</Header>}>
          <SpaceBetween size="l">
            <FormField
              label={t('create.form.clientName')}
              constraintText={t('create.form.clientNameConstraint')}
              errorText={clientNameError}
            >
              <Input
                value={clientName}
                onChange={({ detail }) => {
                  setClientName(detail.value)
                  if (clientNameError.length > 0) setClientNameError('')
                }}
                placeholder={t('create.form.clientNamePlaceholder')}
              />
            </FormField>
            <Toggle
              checked={generateSecret}
              onChange={({ detail }) => { setGenerateSecret(detail.checked) }}
            >
              {t('create.form.generateSecret')}
            </Toggle>
          </SpaceBetween>
        </Container>

        {/* Auth flows */}
        <Container header={<Header variant="h2">{t('create.form.authFlows')}</Header>}>
          <SpaceBetween size="s">
            {AUTH_FLOW_OPTIONS.map((opt) => (
              <Checkbox
                key={opt.value}
                checked={authFlows.has(opt.value)}
                onChange={({ detail }) => { toggleAuthFlow(opt.value, detail.checked) }}
              >
                {t(opt.labelKey)}
              </Checkbox>
            ))}
          </SpaceBetween>
        </Container>

        {/* OAuth */}
        <Container header={<Header variant="h2">{t('detail.oauth.title')}</Header>}>
          <SpaceBetween size="l">
            <Toggle
              checked={oauthEnabled}
              onChange={({ detail }) => { setOauthEnabled(detail.checked) }}
            >
              {t('create.form.oauthEnabled')}
            </Toggle>
            {oauthEnabled && (
              <>
                <FormField label={t('create.form.allowedOAuthFlows')}>
                  <SpaceBetween size="s">
                    <Checkbox
                      checked={allowedOAuthFlows.has('code')}
                      onChange={({ detail }) => { toggleOAuthFlow('code', detail.checked) }}
                    >
                      Authorization code grant
                    </Checkbox>
                    <Checkbox
                      checked={allowedOAuthFlows.has('implicit')}
                      onChange={({ detail }) => { toggleOAuthFlow('implicit', detail.checked) }}
                    >
                      Implicit grant
                    </Checkbox>
                    <Checkbox
                      checked={allowedOAuthFlows.has('client_credentials')}
                      onChange={({ detail }) => { toggleOAuthFlow('client_credentials', detail.checked) }}
                    >
                      Client credentials
                    </Checkbox>
                  </SpaceBetween>
                </FormField>
                <FormField label={t('create.form.allowedOAuthScopes')}>
                  <Input
                    value={allowedOAuthScopes}
                    onChange={({ detail }) => { setAllowedOAuthScopes(detail.value) }}
                    placeholder={t('create.form.allowedOAuthScopesPlaceholder')}
                  />
                </FormField>
                <FormField
                  label={t('create.form.callbackUrls')}
                  constraintText={t('create.form.callbackUrlsConstraint')}
                  errorText={callbackUrlsError}
                >
                  <Textarea
                    value={callbackUrls}
                    onChange={({ detail }) => {
                      setCallbackUrls(detail.value)
                      if (callbackUrlsError.length > 0) setCallbackUrlsError('')
                    }}
                    placeholder={t('create.form.callbackUrlsPlaceholder')}
                    rows={3}
                  />
                </FormField>
                <FormField
                  label={t('create.form.logoutUrls')}
                  constraintText={t('create.form.logoutUrlsConstraint')}
                >
                  <Textarea
                    value={logoutUrls}
                    onChange={({ detail }) => { setLogoutUrls(detail.value) }}
                    placeholder={t('create.form.logoutUrlsPlaceholder')}
                    rows={3}
                  />
                </FormField>
              </>
            )}
          </SpaceBetween>
        </Container>

        {/* Token validity */}
        <Container header={<Header variant="h2">{t('create.form.tokenValidity')}</Header>}>
          <ColumnLayout columns={2}>
            <FormField label={t('create.form.accessTokenValidity')}>
              <SpaceBetween direction="horizontal" size="xs">
                <Input
                  value={accessTokenValidity}
                  onChange={({ detail }) => { setAccessTokenValidity(detail.value) }}
                  inputMode="numeric"
                  type="number"
                />
                <Select
                  selectedOption={TOKEN_UNIT_OPTIONS.find((o) => o.value === accessTokenUnit) ?? { value: 'hours', label: 'Hours' }}
                  options={TOKEN_UNIT_OPTIONS}
                  onChange={({ detail }) => { setAccessTokenUnit(detail.selectedOption.value ?? 'hours') }}
                />
              </SpaceBetween>
            </FormField>
            <FormField label={t('create.form.idTokenValidity')}>
              <SpaceBetween direction="horizontal" size="xs">
                <Input
                  value={idTokenValidity}
                  onChange={({ detail }) => { setIdTokenValidity(detail.value) }}
                  inputMode="numeric"
                  type="number"
                />
                <Select
                  selectedOption={TOKEN_UNIT_OPTIONS.find((o) => o.value === idTokenUnit) ?? { value: 'hours', label: 'Hours' }}
                  options={TOKEN_UNIT_OPTIONS}
                  onChange={({ detail }) => { setIdTokenUnit(detail.selectedOption.value ?? 'hours') }}
                />
              </SpaceBetween>
            </FormField>
            <FormField label={t('create.form.refreshTokenValidity')}>
              <SpaceBetween direction="horizontal" size="xs">
                <Input
                  value={refreshTokenValidity}
                  onChange={({ detail }) => { setRefreshTokenValidity(detail.value) }}
                  inputMode="numeric"
                  type="number"
                />
                <Select
                  selectedOption={TOKEN_UNIT_OPTIONS.find((o) => o.value === refreshTokenUnit) ?? { value: 'days', label: 'Days' }}
                  options={TOKEN_UNIT_OPTIONS}
                  onChange={({ detail }) => { setRefreshTokenUnit(detail.selectedOption.value ?? 'days') }}
                />
              </SpaceBetween>
            </FormField>
          </ColumnLayout>
        </Container>

        {/* Advanced settings */}
        <Container header={<Header variant="h2">{t('detail.settings.title')}</Header>}>
          <SpaceBetween size="l">
            <Toggle
              checked={preventUserExistenceErrors}
              onChange={({ detail }) => { setPreventUserExistenceErrors(detail.checked) }}
              description={t('create.form.preventUserExistenceErrorsDescription')}
            >
              {t('create.form.preventUserExistenceErrors')}
            </Toggle>
            <Toggle
              checked={enableTokenRevocation}
              onChange={({ detail }) => { setEnableTokenRevocation(detail.checked) }}
              description={t('create.form.enableTokenRevocationDescription')}
            >
              {t('create.form.enableTokenRevocation')}
            </Toggle>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </Form>
  )
}
