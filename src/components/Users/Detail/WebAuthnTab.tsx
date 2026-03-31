import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Table from '@cloudscape-design/components/table'
import Header from '@cloudscape-design/components/header'
import Button from '@cloudscape-design/components/button'
import Box from '@cloudscape-design/components/box'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Modal from '@cloudscape-design/components/modal'
import Alert from '@cloudscape-design/components/alert'
import type { WebAuthnCredentialDescription } from '@aws-sdk/client-cognito-identity-provider'
import {
  useListWebAuthnCredentials,
  useDeleteWebAuthnCredential,
} from '../../../api/hooks/useUsers'
import { useNotifications } from '../../../hooks/useNotifications'
import { PermissionGate } from '../../PermissionGate'

interface WebAuthnTabProps {
  userPoolId: string
  username: string
}

interface DeleteModalState {
  credentialId: string
  friendlyName: string
}

function formatDate(date: Date | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function WebAuthnTab({ userPoolId, username }: WebAuthnTabProps) {
  const { t } = useTranslation('webauthn')
  const { addNotification } = useNotifications()

  const credentialsQuery = useListWebAuthnCredentials(userPoolId, username)
  const deleteCredential = useDeleteWebAuthnCredential()

  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null)

  const credentials = credentialsQuery.data?.Credentials ?? []

  const handleDelete = () => {
    if (!deleteModal) return
    deleteCredential.mutate(
      {
        userPoolId,
        username,
        credentialId: deleteModal.credentialId,
      },
      {
        onSuccess: () => {
          addNotification({
            id: `delete-webauthn-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.deleteSuccess'),
            dismissible: true,
          })
          setDeleteModal(null)
        },
        onError: () => {
          addNotification({
            id: `delete-webauthn-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.deleteError'),
            dismissible: true,
          })
        },
      },
    )
  }

  return (
    <SpaceBetween size="m">
      <Alert type="info">
        {t('adminNote')}
      </Alert>

      <Table
        columnDefinitions={[
          {
            id: 'credentialId',
            header: t('credentialId'),
            cell: (item: WebAuthnCredentialDescription) => item.CredentialId ?? '—',
          },
          {
            id: 'friendlyName',
            header: t('friendlyName'),
            cell: (item: WebAuthnCredentialDescription) => item.FriendlyCredentialName ?? '—',
          },
          {
            id: 'relyingPartyId',
            header: t('relyingPartyId'),
            cell: (item: WebAuthnCredentialDescription) => item.RelyingPartyId ?? '—',
          },
          {
            id: 'authenticatorType',
            header: t('authenticatorType'),
            cell: (item: WebAuthnCredentialDescription) => item.AuthenticatorAttachment ?? '—',
          },
          {
            id: 'transports',
            header: t('transports'),
            cell: (item: WebAuthnCredentialDescription) =>
              (item.AuthenticatorTransports ?? []).join(', ') || '—',
          },
          {
            id: 'created',
            header: t('created'),
            cell: (item: WebAuthnCredentialDescription) => formatDate(item.CreatedAt),
          },
          {
            id: 'actions',
            header: '',
            cell: (item: WebAuthnCredentialDescription) => (
              <PermissionGate permission="DeleteWebAuthnCredential">
                <Button
                  variant="inline-link"
                  onClick={() => {
                    setDeleteModal({
                      credentialId: item.CredentialId ?? '',
                      friendlyName: item.FriendlyCredentialName ?? '',
                    })
                  }}
                >
                  {t('deleteButton')}
                </Button>
              </PermissionGate>
            ),
            width: 100,
          },
        ]}
        items={credentials}
        loading={credentialsQuery.isLoading}
        variant="embedded"
        header={
          <Header variant="h2">
            {t('title')}
          </Header>
        }
        empty={
          <Box textAlign="center" color="text-body-secondary" padding="s">
            {t('empty')}
          </Box>
        }
      />

      {/* Delete credential modal */}
      {deleteModal !== null && (
        <Modal
          visible
          onDismiss={() => { setDeleteModal(null) }}
          header={t('deleteModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setDeleteModal(null) }}>
                  {t('deleteModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDelete}
                  loading={deleteCredential.isPending}
                >
                  {t('deleteModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('deleteModal.description', { name: deleteModal.friendlyName })}
        </Modal>
      )}
    </SpaceBetween>
  )
}
