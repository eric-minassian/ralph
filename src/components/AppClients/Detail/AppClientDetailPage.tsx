import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Header from '@cloudscape-design/components/header'
import Button from '@cloudscape-design/components/button'
import Box from '@cloudscape-design/components/box'
import Spinner from '@cloudscape-design/components/spinner'
import Alert from '@cloudscape-design/components/alert'
import Container from '@cloudscape-design/components/container'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Modal from '@cloudscape-design/components/modal'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Table from '@cloudscape-design/components/table'
import Badge from '@cloudscape-design/components/badge'
import type { ClientSecretDescriptorType } from '@aws-sdk/client-cognito-identity-provider'
import {
  useDescribeAppClient,
  useDeleteAppClient,
  useListAppClientSecrets,
  useAddAppClientSecret,
  useDeleteAppClientSecret,
} from '../../../api/hooks/useAppClients'
import { useNotifications } from '../../../hooks/useNotifications'
import { PermissionGate } from '../../PermissionGate'

interface AppClientDetailPageProps {
  userPoolId: string
  clientId: string
}

type ModalState =
  | { type: 'delete'; confirmText: string }
  | { type: 'deleteSecret'; clientSecretId: string }
  | { type: 'newSecret'; clientSecretId: string; secretValue: string; copied: boolean }

function formatDate(date: Date | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTokenValidity(value: number | undefined, unit: string | undefined): string {
  if (value === undefined) return '—'
  return `${String(value)} ${unit ?? ''}`
}

export function AppClientDetailPage({ userPoolId, clientId }: AppClientDetailPageProps) {
  const { t } = useTranslation('appClients')
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const clientQuery = useDescribeAppClient(userPoolId, clientId)
  const secretsQuery = useListAppClientSecrets(userPoolId, clientId)
  const deleteAppClient = useDeleteAppClient()
  const addSecret = useAddAppClientSecret()
  const deleteSecret = useDeleteAppClientSecret()

  const [modal, setModal] = useState<ModalState | null>(null)

  const { data, isLoading, isError } = clientQuery
  const client = data?.UserPoolClient

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
        <Box variant="p" padding="s">{t('detail.loading')}</Box>
      </Box>
    )
  }

  if (isError || !client) {
    return (
      <Alert
        type="error"
        header={t('detail.notFound')}
        action={
          <Button onClick={() => {
            void navigate({ to: '/user-pools/$userPoolId/app-clients', params: { userPoolId } })
          }}>
            {t('detail.backToList')}
          </Button>
        }
      >
        {t('detail.notFoundDescription')}
      </Alert>
    )
  }

  const secrets = secretsQuery.data?.ClientSecrets ?? []
  const clientName = client.ClientName ?? ''

  const handleDelete = () => {
    if (modal?.type !== 'delete' || modal.confirmText !== clientName) return
    deleteAppClient.mutate(
      { UserPoolId: userPoolId, ClientId: clientId },
      {
        onSuccess: () => {
          addNotification({
            id: `delete-client-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.deleteSuccess', { name: clientName }),
            dismissible: true,
          })
          void navigate({ to: '/user-pools/$userPoolId/app-clients', params: { userPoolId } })
        },
        onError: () => {
          addNotification({
            id: `delete-client-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.deleteError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleCreateSecret = () => {
    addSecret.mutate(
      { UserPoolId: userPoolId, ClientId: clientId },
      {
        onSuccess: (result) => {
          const secret = result.ClientSecretDescriptor
          if (secret) {
            setModal({
              type: 'newSecret',
              clientSecretId: typeof secret.ClientSecretId === 'string' ? secret.ClientSecretId : '',
              secretValue: typeof secret.ClientSecretValue === 'string' ? secret.ClientSecretValue : '',
              copied: false,
            })
          }
          addNotification({
            id: `create-secret-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.secretCreatedSuccess'),
            dismissible: true,
          })
        },
        onError: () => {
          addNotification({
            id: `create-secret-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.secretCreatedError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleDeleteSecret = () => {
    if (modal?.type !== 'deleteSecret') return
    deleteSecret.mutate(
      { UserPoolId: userPoolId, ClientId: clientId, ClientSecretId: modal.clientSecretId },
      {
        onSuccess: () => {
          addNotification({
            id: `delete-secret-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.secretDeletedSuccess'),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `delete-secret-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.secretDeletedError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleCopySecret = () => {
    if (modal?.type !== 'newSecret') return
    void navigator.clipboard.writeText(modal.secretValue).then(() => {
      setModal({ ...modal, copied: true })
    })
  }

  const authFlows = client.ExplicitAuthFlows ?? []
  const oauthEnabled = client.AllowedOAuthFlowsUserPoolClient === true
  const oauthFlows = client.AllowedOAuthFlows ?? []
  const oauthScopes = client.AllowedOAuthScopes ?? []
  const callbackUrls = client.CallbackURLs ?? []
  const logoutUrls = client.LogoutURLs ?? []
  const readAttrs = client.ReadAttributes ?? []
  const writeAttrs = client.WriteAttributes ?? []

  return (
    <>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <PermissionGate permission="DeleteUserPoolClient">
                <Button onClick={() => { setModal({ type: 'delete', confirmText: '' }) }}>
                  {t('detail.deleteButton')}
                </Button>
              </PermissionGate>
            </SpaceBetween>
          }
        >
          {t('detail.title', { name: clientName })}
        </Header>

        {/* General settings */}
        <Container header={<Header variant="h2">{t('detail.general.title')}</Header>}>
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">{t('detail.general.clientName')}</Box>
              <div>{clientName}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.clientId')}</Box>
              <div>{client.ClientId ?? '—'}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.hasSecret')}</Box>
              <div>{client.ClientSecret ? t('detail.general.hasSecretYes') : t('detail.general.hasSecretNo')}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.creationDate')}</Box>
              <div>{formatDate(client.CreationDate)}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.lastModifiedDate')}</Box>
              <div>{formatDate(client.LastModifiedDate)}</div>
            </div>
          </ColumnLayout>
        </Container>

        {/* Client secrets */}
        <Table<ClientSecretDescriptorType>
          columnDefinitions={[
            {
              id: 'secretId',
              header: t('detail.secrets.secretId'),
              cell: (item) => item.ClientSecretId ?? '—',
              isRowHeader: true,
            },
            {
              id: 'creationDate',
              header: t('detail.secrets.creationDate'),
              cell: (item) => formatDate(item.ClientSecretCreateDate),
            },
            {
              id: 'actions',
              header: '',
              cell: (item) => (
                <PermissionGate permission="DeleteUserPoolClientSecret">
                  <Button
                    variant="inline-link"
                    onClick={() => { setModal({ type: 'deleteSecret', clientSecretId: item.ClientSecretId ?? '' }) }}
                  >
                    {t('detail.secrets.deleteButton')}
                  </Button>
                </PermissionGate>
              ),
              width: 100,
            },
          ]}
          items={secrets}
          loading={secretsQuery.isLoading}
          variant="embedded"
          header={
            <Header
              variant="h2"
              actions={
                <PermissionGate permission="AddUserPoolClientSecret">
                  <Button onClick={handleCreateSecret} loading={addSecret.isPending}>
                    {t('detail.secrets.createButton')}
                  </Button>
                </PermissionGate>
              }
            >
              {t('detail.secrets.title')}
            </Header>
          }
          empty={
            <Box textAlign="center" color="text-body-secondary" padding="s">
              {t('detail.secrets.empty')}
            </Box>
          }
        />

        {/* Auth flows */}
        <Container header={<Header variant="h2">{t('detail.authFlows.title')}</Header>}>
          {authFlows.length > 0 ? (
            <SpaceBetween direction="horizontal" size="xs">
              {authFlows.map((flow) => (
                <Badge key={flow}>{t(`detail.authFlows.${flow}`, { defaultValue: flow })}</Badge>
              ))}
            </SpaceBetween>
          ) : (
            <Box color="text-body-secondary">{t('detail.authFlows.noneConfigured')}</Box>
          )}
        </Container>

        {/* OAuth settings */}
        <Container header={<Header variant="h2">{t('detail.oauth.title')}</Header>}>
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">{t('detail.oauth.enabled')}</Box>
              <div>{oauthEnabled ? t('detail.oauth.enabledYes') : t('detail.oauth.enabledNo')}</div>
            </div>
            {oauthEnabled && (
              <>
                <div>
                  <Box variant="awsui-key-label">{t('detail.oauth.allowedFlows')}</Box>
                  <div>{oauthFlows.length > 0 ? oauthFlows.join(', ') : t('detail.oauth.noneConfigured')}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">{t('detail.oauth.allowedScopes')}</Box>
                  <div>{oauthScopes.length > 0 ? oauthScopes.join(', ') : t('detail.oauth.noneConfigured')}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">{t('detail.oauth.callbackUrls')}</Box>
                  <div>{callbackUrls.length > 0 ? callbackUrls.join(', ') : t('detail.oauth.noneConfigured')}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">{t('detail.oauth.logoutUrls')}</Box>
                  <div>{logoutUrls.length > 0 ? logoutUrls.join(', ') : t('detail.oauth.noneConfigured')}</div>
                </div>
              </>
            )}
          </ColumnLayout>
        </Container>

        {/* Token validity */}
        <Container header={<Header variant="h2">{t('detail.tokenValidity.title')}</Header>}>
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">{t('detail.tokenValidity.accessToken')}</Box>
              <div>{formatTokenValidity(client.AccessTokenValidity, client.TokenValidityUnits?.AccessToken)}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.tokenValidity.idToken')}</Box>
              <div>{formatTokenValidity(client.IdTokenValidity, client.TokenValidityUnits?.IdToken)}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.tokenValidity.refreshToken')}</Box>
              <div>{formatTokenValidity(client.RefreshTokenValidity, client.TokenValidityUnits?.RefreshToken)}</div>
            </div>
          </ColumnLayout>
        </Container>

        {/* Attribute permissions */}
        {(readAttrs.length > 0 || writeAttrs.length > 0) && (
          <Container header={<Header variant="h2">{t('detail.attributes.title')}</Header>}>
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">{t('detail.attributes.readAttributes')}</Box>
                <div>{readAttrs.length > 0 ? readAttrs.join(', ') : t('detail.attributes.noneConfigured')}</div>
              </div>
              <div>
                <Box variant="awsui-key-label">{t('detail.attributes.writeAttributes')}</Box>
                <div>{writeAttrs.length > 0 ? writeAttrs.join(', ') : t('detail.attributes.noneConfigured')}</div>
              </div>
            </ColumnLayout>
          </Container>
        )}

        {/* Advanced settings */}
        <Container header={<Header variant="h2">{t('detail.settings.title')}</Header>}>
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">{t('detail.settings.preventUserExistenceErrors')}</Box>
              <div>{client.PreventUserExistenceErrors === 'ENABLED' ? t('detail.settings.enabled') : t('detail.settings.disabled')}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.settings.enableTokenRevocation')}</Box>
              <div>{client.EnableTokenRevocation === true ? t('detail.settings.enabled') : t('detail.settings.disabled')}</div>
            </div>
          </ColumnLayout>
        </Container>
      </SpaceBetween>

      {/* Delete modal */}
      {modal?.type === 'delete' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.delete.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.delete.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDelete}
                  loading={deleteAppClient.isPending}
                  disabled={modal.confirmText !== clientName}
                >
                  {t('detail.delete.deleteButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <Box>{t('detail.delete.description')}</Box>
            <FormField label={t('detail.delete.confirmLabel')}>
              <Input
                value={modal.confirmText}
                onChange={({ detail }) => { setModal({ type: 'delete', confirmText: detail.value }) }}
                placeholder={t('detail.delete.confirmPlaceholder')}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      )}

      {/* Delete secret modal */}
      {modal?.type === 'deleteSecret' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.secrets.deleteModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.secrets.deleteModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteSecret}
                  loading={deleteSecret.isPending}
                >
                  {t('detail.secrets.deleteModal.deleteButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('detail.secrets.deleteModal.description')}
        </Modal>
      )}

      {/* New secret modal */}
      {modal?.type === 'newSecret' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.secrets.newSecret.title')}
          footer={
            <Box float="right">
              <Button variant="primary" onClick={() => { setModal(null) }}>
                {t('detail.secrets.newSecret.closeButton')}
              </Button>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <Alert type="warning">
              {t('detail.secrets.newSecret.description')}
            </Alert>
            <FormField label={t('detail.secrets.newSecret.secretValue')}>
              <SpaceBetween direction="horizontal" size="xs">
                <Input value={modal.secretValue} readOnly />
                <Button onClick={handleCopySecret}>
                  {modal.copied ? t('detail.secrets.newSecret.copied') : t('detail.secrets.newSecret.copyButton')}
                </Button>
              </SpaceBetween>
            </FormField>
          </SpaceBetween>
        </Modal>
      )}
    </>
  )
}
