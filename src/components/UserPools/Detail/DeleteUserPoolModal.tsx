import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Modal from '@cloudscape-design/components/modal'
import Box from '@cloudscape-design/components/box'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Button from '@cloudscape-design/components/button'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Alert from '@cloudscape-design/components/alert'
import type { UserPoolType } from '@aws-sdk/client-cognito-identity-provider'
import { useDeleteUserPool } from '../../../api/hooks/useUserPools'
import { useNotifications } from '../../../hooks/useNotifications'

interface DeleteUserPoolModalProps {
  userPool: UserPoolType
  onDismiss: () => void
}

export function DeleteUserPoolModal({ userPool, onDismiss }: DeleteUserPoolModalProps) {
  const { t } = useTranslation('userPools')
  const navigate = useNavigate()
  const deleteUserPool = useDeleteUserPool()
  const { addNotification } = useNotifications()

  const [confirmText, setConfirmText] = useState('')
  const poolName = userPool.Name ?? ''
  const isProtected = userPool.DeletionProtection === 'ACTIVE'
  const isMatch = confirmText === poolName

  const handleDelete = () => {
    if (!isMatch || isProtected) return

    deleteUserPool.mutate(
      { UserPoolId: userPool.Id ?? '' },
      {
        onSuccess: () => {
          addNotification({
            id: `delete-pool-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.deleteSuccess', { name: poolName }),
            dismissible: true,
          })
          void navigate({ to: '/user-pools' })
        },
        onError: () => {
          addNotification({
            id: `delete-pool-error-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.deleteError'),
            dismissible: true,
          })
        },
      },
    )
  }

  return (
    <Modal
      visible
      onDismiss={onDismiss}
      header={t('detail.delete.title')}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              {t('detail.delete.cancelButton')}
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              loading={deleteUserPool.isPending}
              disabled={!isMatch || isProtected}
            >
              {t('detail.delete.deleteButton')}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="l">
        {isProtected && (
          <Alert type="warning">{t('detail.delete.protectionWarning')}</Alert>
        )}
        <Box>{t('detail.delete.description')}</Box>
        <FormField
          label={t('detail.delete.confirmLabel')}
          errorText={
            confirmText.length > 0 && !isMatch
              ? t('detail.delete.mismatch')
              : undefined
          }
        >
          <Input
            value={confirmText}
            onChange={({ detail }) => { setConfirmText(detail.value) }}
            placeholder={t('detail.delete.confirmPlaceholder')}
            disabled={isProtected}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  )
}
