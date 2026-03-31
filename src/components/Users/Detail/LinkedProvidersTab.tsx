import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Table from '@cloudscape-design/components/table'
import Header from '@cloudscape-design/components/header'
import Button from '@cloudscape-design/components/button'
import Box from '@cloudscape-design/components/box'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Modal from '@cloudscape-design/components/modal'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import {
  useAdminLinkProviderForUser,
  useAdminDisableProviderForUser,
} from '../../../api/hooks/useUsers'
import { useNotifications } from '../../../hooks/useNotifications'
import { PermissionGate } from '../../PermissionGate'

interface LinkedProvider {
  ProviderName: string
  ProviderAttributeName: string
  ProviderAttributeValue: string
}

interface LinkedProvidersTabProps {
  userPoolId: string
  username: string
  linkedProviders: LinkedProvider[]
}

interface LinkModalState {
  providerName: string
  providerAttributeName: string
  providerAttributeValue: string
}

type ModalState =
  | { type: 'link'; form: LinkModalState }
  | { type: 'unlink'; provider: LinkedProvider }

export function LinkedProvidersTab({ userPoolId, username, linkedProviders }: LinkedProvidersTabProps) {
  const { t } = useTranslation('users')
  const { addNotification } = useNotifications()

  const linkProvider = useAdminLinkProviderForUser()
  const unlinkProvider = useAdminDisableProviderForUser()

  const [modal, setModal] = useState<ModalState | null>(null)

  const handleLinkProvider = () => {
    if (modal?.type !== 'link') return
    const { providerName, providerAttributeName, providerAttributeValue } = modal.form
    if (providerName.trim().length === 0 || providerAttributeValue.trim().length === 0) return

    linkProvider.mutate(
      {
        UserPoolId: userPoolId,
        DestinationUser: {
          ProviderName: 'Cognito',
          ProviderAttributeName: 'Username',
          ProviderAttributeValue: username,
        },
        SourceUser: {
          ProviderName: providerName.trim(),
          ProviderAttributeName: providerAttributeName.trim() || 'Cognito_Subject',
          ProviderAttributeValue: providerAttributeValue.trim(),
        },
      },
      {
        onSuccess: () => {
          addNotification({
            id: `link-provider-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.linkProviderSuccess', { providerName: providerName.trim() }),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `link-provider-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.linkProviderError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleUnlinkProvider = () => {
    if (modal?.type !== 'unlink') return
    const { ProviderName, ProviderAttributeName, ProviderAttributeValue } = modal.provider

    unlinkProvider.mutate(
      {
        UserPoolId: userPoolId,
        User: {
          ProviderName,
          ProviderAttributeName,
          ProviderAttributeValue,
        },
      },
      {
        onSuccess: () => {
          addNotification({
            id: `unlink-provider-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.unlinkProviderSuccess', { providerName: ProviderName }),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `unlink-provider-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.unlinkProviderError'),
            dismissible: true,
          })
        },
      },
    )
  }

  return (
    <>
      <Table
        columnDefinitions={[
          {
            id: 'providerName',
            header: t('detail.linkedProviders.providerName'),
            cell: (item: LinkedProvider) => item.ProviderName,
          },
          {
            id: 'providerAttributeName',
            header: t('detail.linkedProviders.providerAttributeName'),
            cell: (item: LinkedProvider) => item.ProviderAttributeName || '—',
          },
          {
            id: 'providerAttributeValue',
            header: t('detail.linkedProviders.providerAttributeValue'),
            cell: (item: LinkedProvider) => item.ProviderAttributeValue || '—',
          },
          {
            id: 'actions',
            header: '',
            cell: (item: LinkedProvider) => (
              <PermissionGate permission="AdminDisableProviderForUser">
                <Button
                  variant="inline-link"
                  onClick={() => { setModal({ type: 'unlink', provider: item }) }}
                >
                  {t('detail.linkedProviders.unlinkButton')}
                </Button>
              </PermissionGate>
            ),
            width: 100,
          },
        ]}
        items={linkedProviders}
        variant="embedded"
        header={
          <Header
            variant="h2"
            actions={
              <PermissionGate permission="AdminLinkProviderForUser">
                <Button
                  onClick={() => {
                    setModal({
                      type: 'link',
                      form: {
                        providerName: '',
                        providerAttributeName: 'Cognito_Subject',
                        providerAttributeValue: '',
                      },
                    })
                  }}
                >
                  {t('detail.linkedProviders.linkButton')}
                </Button>
              </PermissionGate>
            }
          >
            {t('detail.linkedProviders.title')}
          </Header>
        }
        empty={
          <Box textAlign="center" color="text-body-secondary" padding="s">
            {t('detail.linkedProviders.empty')}
          </Box>
        }
      />

      {/* Link provider modal */}
      {modal?.type === 'link' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.linkedProviders.linkModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.linkedProviders.linkModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleLinkProvider}
                  loading={linkProvider.isPending}
                  disabled={
                    modal.form.providerName.trim().length === 0 ||
                    modal.form.providerAttributeValue.trim().length === 0
                  }
                >
                  {t('detail.linkedProviders.linkModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="l">
            <FormField label={t('detail.linkedProviders.linkModal.providerName')}>
              <Input
                value={modal.form.providerName}
                onChange={({ detail }) => {
                  setModal({
                    type: 'link',
                    form: { ...modal.form, providerName: detail.value },
                  })
                }}
                placeholder={t('detail.linkedProviders.linkModal.providerNamePlaceholder')}
              />
            </FormField>
            <FormField label={t('detail.linkedProviders.linkModal.providerAttributeName')}>
              <Input
                value={modal.form.providerAttributeName}
                onChange={({ detail }) => {
                  setModal({
                    type: 'link',
                    form: { ...modal.form, providerAttributeName: detail.value },
                  })
                }}
                placeholder={t('detail.linkedProviders.linkModal.providerAttributeNamePlaceholder')}
              />
            </FormField>
            <FormField label={t('detail.linkedProviders.linkModal.providerAttributeValue')}>
              <Input
                value={modal.form.providerAttributeValue}
                onChange={({ detail }) => {
                  setModal({
                    type: 'link',
                    form: { ...modal.form, providerAttributeValue: detail.value },
                  })
                }}
                placeholder={t('detail.linkedProviders.linkModal.providerAttributeValuePlaceholder')}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      )}

      {/* Unlink provider modal */}
      {modal?.type === 'unlink' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.linkedProviders.unlinkModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.linkedProviders.unlinkModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUnlinkProvider}
                  loading={unlinkProvider.isPending}
                >
                  {t('detail.linkedProviders.unlinkModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('detail.linkedProviders.unlinkModal.description', { providerName: modal.provider.ProviderName })}
        </Modal>
      )}
    </>
  )
}
