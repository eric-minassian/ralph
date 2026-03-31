import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import ButtonDropdown from '@cloudscape-design/components/button-dropdown'
import Modal from '@cloudscape-design/components/modal'
import Box from '@cloudscape-design/components/box'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Button from '@cloudscape-design/components/button'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Checkbox from '@cloudscape-design/components/checkbox'
import ProgressBar from '@cloudscape-design/components/progress-bar'
import {
  useAdminEnableUser,
  useAdminDisableUser,
  useAdminResetUserPassword,
  useAdminSetUserPassword,
  useAdminConfirmSignUp,
  useAdminUserGlobalSignOut,
  useAdminDeleteUser,
} from '../../../api/hooks/useUsers'
import { useNotifications } from '../../../hooks/useNotifications'
import { usePermissions } from '../../../hooks/usePermissions'

type ActionModalType =
  | 'enable'
  | 'disable'
  | 'resetPassword'
  | 'setPassword'
  | 'confirmSignUp'
  | 'globalSignOut'
  | 'delete'

interface UserActionsProps {
  userPoolId: string
  username: string
  enabled: boolean
  userStatus: string | undefined
}

function getPasswordStrength(password: string): { score: number; label: string; key: string } {
  let score = 0
  if (password.length >= 8) score += 25
  if (/[A-Z]/.test(password)) score += 25
  if (/[0-9]/.test(password)) score += 25
  if (/[^A-Za-z0-9]/.test(password)) score += 25

  if (score <= 25) return { score, label: 'strengthWeak', key: 'weak' }
  if (score <= 50) return { score, label: 'strengthFair', key: 'fair' }
  if (score <= 75) return { score, label: 'strengthGood', key: 'good' }
  return { score, label: 'strengthStrong', key: 'strong' }
}

export function UserActions({ userPoolId, username, enabled, userStatus }: UserActionsProps) {
  const { t } = useTranslation('users')
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const { hasPermission } = usePermissions()

  const enableUser = useAdminEnableUser()
  const disableUser = useAdminDisableUser()
  const resetPassword = useAdminResetUserPassword()
  const setPassword = useAdminSetUserPassword()
  const confirmSignUp = useAdminConfirmSignUp()
  const globalSignOut = useAdminUserGlobalSignOut()
  const deleteUser = useAdminDeleteUser()

  const [activeModal, setActiveModal] = useState<ActionModalType | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isPermanent, setIsPermanent] = useState(true)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const closeModal = () => {
    setActiveModal(null)
    setNewPassword('')
    setIsPermanent(true)
    setDeleteConfirmation('')
  }

  const handleEnable = () => {
    enableUser.mutate(
      { UserPoolId: userPoolId, Username: username },
      {
        onSuccess: () => {
          addNotification({ id: `enable-${String(Date.now())}`, type: 'success', content: t('notifications.enableSuccess'), dismissible: true })
          closeModal()
        },
        onError: () => {
          addNotification({ id: `enable-err-${String(Date.now())}`, type: 'error', content: t('notifications.enableError'), dismissible: true })
        },
      },
    )
  }

  const handleDisable = () => {
    disableUser.mutate(
      { UserPoolId: userPoolId, Username: username },
      {
        onSuccess: () => {
          addNotification({ id: `disable-${String(Date.now())}`, type: 'success', content: t('notifications.disableSuccess'), dismissible: true })
          closeModal()
        },
        onError: () => {
          addNotification({ id: `disable-err-${String(Date.now())}`, type: 'error', content: t('notifications.disableError'), dismissible: true })
        },
      },
    )
  }

  const handleResetPassword = () => {
    resetPassword.mutate(
      { UserPoolId: userPoolId, Username: username },
      {
        onSuccess: () => {
          addNotification({ id: `reset-${String(Date.now())}`, type: 'success', content: t('notifications.resetPasswordSuccess', { username }), dismissible: true })
          closeModal()
        },
        onError: () => {
          addNotification({ id: `reset-err-${String(Date.now())}`, type: 'error', content: t('notifications.resetPasswordError'), dismissible: true })
        },
      },
    )
  }

  const handleSetPassword = () => {
    if (newPassword.length === 0) return
    setPassword.mutate(
      { UserPoolId: userPoolId, Username: username, Password: newPassword, Permanent: isPermanent },
      {
        onSuccess: () => {
          addNotification({ id: `setpw-${String(Date.now())}`, type: 'success', content: t('notifications.setPasswordSuccess', { username }), dismissible: true })
          closeModal()
        },
        onError: () => {
          addNotification({ id: `setpw-err-${String(Date.now())}`, type: 'error', content: t('notifications.setPasswordError'), dismissible: true })
        },
      },
    )
  }

  const handleConfirmSignUp = () => {
    confirmSignUp.mutate(
      { UserPoolId: userPoolId, Username: username },
      {
        onSuccess: () => {
          addNotification({ id: `confirm-${String(Date.now())}`, type: 'success', content: t('notifications.confirmSignUpSuccess', { username }), dismissible: true })
          closeModal()
        },
        onError: () => {
          addNotification({ id: `confirm-err-${String(Date.now())}`, type: 'error', content: t('notifications.confirmSignUpError'), dismissible: true })
        },
      },
    )
  }

  const handleGlobalSignOut = () => {
    globalSignOut.mutate(
      { UserPoolId: userPoolId, Username: username },
      {
        onSuccess: () => {
          addNotification({ id: `signout-${String(Date.now())}`, type: 'success', content: t('notifications.globalSignOutSuccess', { username }), dismissible: true })
          closeModal()
        },
        onError: () => {
          addNotification({ id: `signout-err-${String(Date.now())}`, type: 'error', content: t('notifications.globalSignOutError'), dismissible: true })
        },
      },
    )
  }

  const handleDelete = () => {
    if (deleteConfirmation !== username) return
    deleteUser.mutate(
      { UserPoolId: userPoolId, Username: username },
      {
        onSuccess: () => {
          addNotification({ id: `delete-${String(Date.now())}`, type: 'success', content: t('notifications.deleteSuccess'), dismissible: true })
          closeModal()
          void navigate({ to: '/user-pools/$userPoolId/users', params: { userPoolId } })
        },
        onError: () => {
          addNotification({ id: `delete-err-${String(Date.now())}`, type: 'error', content: t('notifications.deleteError'), dismissible: true })
        },
      },
    )
  }

  const items = [
    ...(enabled
      ? [{ id: 'disable', text: t('detail.actions.disable'), disabled: !hasPermission('AdminDisableUser') }]
      : [{ id: 'enable', text: t('detail.actions.enable'), disabled: !hasPermission('AdminEnableUser') }]),
    { id: 'resetPassword', text: t('detail.actions.resetPassword'), disabled: !hasPermission('AdminResetUserPassword') },
    { id: 'setPassword', text: t('detail.actions.setPassword'), disabled: !hasPermission('AdminSetUserPassword') },
    ...(userStatus === 'UNCONFIRMED' || userStatus === 'FORCE_CHANGE_PASSWORD'
      ? [{ id: 'confirmSignUp', text: t('detail.actions.confirmSignUp'), disabled: !hasPermission('AdminConfirmSignUp') }]
      : []),
    { id: 'globalSignOut', text: t('detail.actions.globalSignOut'), disabled: !hasPermission('AdminUserGlobalSignOut') },
    { id: 'delete', text: t('detail.actions.delete'), disabled: !hasPermission('AdminDeleteUser') },
  ]

  const onItemClick = (itemId: string) => {
    switch (itemId) {
      case 'enable':
      case 'disable':
      case 'resetPassword':
      case 'setPassword':
      case 'confirmSignUp':
      case 'globalSignOut':
      case 'delete':
        setActiveModal(itemId)
        break
    }
  }

  const strength = getPasswordStrength(newPassword)

  return (
    <>
      <ButtonDropdown
        items={items}
        onItemClick={({ detail }) => { onItemClick(detail.id) }}
      >
        {t('detail.actions.label')}
      </ButtonDropdown>

      {/* Enable modal */}
      {activeModal === 'enable' && (
        <Modal
          visible
          onDismiss={closeModal}
          header={t('detail.actions.enableModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={closeModal}>{t('detail.actions.enableModal.cancelButton')}</Button>
                <Button variant="primary" onClick={handleEnable} loading={enableUser.isPending}>{t('detail.actions.enableModal.submitButton')}</Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('detail.actions.enableModal.description', { username })}
        </Modal>
      )}

      {/* Disable modal */}
      {activeModal === 'disable' && (
        <Modal
          visible
          onDismiss={closeModal}
          header={t('detail.actions.disableModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={closeModal}>{t('detail.actions.disableModal.cancelButton')}</Button>
                <Button variant="primary" onClick={handleDisable} loading={disableUser.isPending}>{t('detail.actions.disableModal.submitButton')}</Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('detail.actions.disableModal.description', { username })}
        </Modal>
      )}

      {/* Reset password modal */}
      {activeModal === 'resetPassword' && (
        <Modal
          visible
          onDismiss={closeModal}
          header={t('detail.actions.resetPasswordModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={closeModal}>{t('detail.actions.resetPasswordModal.cancelButton')}</Button>
                <Button variant="primary" onClick={handleResetPassword} loading={resetPassword.isPending}>{t('detail.actions.resetPasswordModal.submitButton')}</Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('detail.actions.resetPasswordModal.description', { username })}
        </Modal>
      )}

      {/* Set password modal */}
      {activeModal === 'setPassword' && (
        <Modal
          visible
          onDismiss={closeModal}
          header={t('detail.actions.setPasswordModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={closeModal}>{t('detail.actions.setPasswordModal.cancelButton')}</Button>
                <Button variant="primary" onClick={handleSetPassword} loading={setPassword.isPending} disabled={newPassword.length === 0}>{t('detail.actions.setPasswordModal.submitButton')}</Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="l">
            <FormField label={t('detail.actions.setPasswordModal.password')}>
              <Input
                type="password"
                value={newPassword}
                onChange={({ detail }) => { setNewPassword(detail.value) }}
                placeholder={t('detail.actions.setPasswordModal.passwordPlaceholder')}
              />
            </FormField>
            {newPassword.length > 0 && (
              <FormField label={t('detail.actions.setPasswordModal.strengthLabel')}>
                <ProgressBar
                  value={strength.score}
                  additionalInfo={t(`detail.actions.setPasswordModal.${strength.label}`)}
                  status={strength.score === 100 ? 'success' : 'in-progress'}
                />
              </FormField>
            )}
            <Checkbox
              checked={isPermanent}
              onChange={({ detail }) => { setIsPermanent(detail.checked) }}
              description={t('detail.actions.setPasswordModal.permanentDescription')}
            >
              {t('detail.actions.setPasswordModal.permanent')}
            </Checkbox>
          </SpaceBetween>
        </Modal>
      )}

      {/* Confirm sign-up modal */}
      {activeModal === 'confirmSignUp' && (
        <Modal
          visible
          onDismiss={closeModal}
          header={t('detail.actions.confirmSignUpModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={closeModal}>{t('detail.actions.confirmSignUpModal.cancelButton')}</Button>
                <Button variant="primary" onClick={handleConfirmSignUp} loading={confirmSignUp.isPending}>{t('detail.actions.confirmSignUpModal.submitButton')}</Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('detail.actions.confirmSignUpModal.description', { username })}
        </Modal>
      )}

      {/* Global sign-out modal */}
      {activeModal === 'globalSignOut' && (
        <Modal
          visible
          onDismiss={closeModal}
          header={t('detail.actions.globalSignOutModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={closeModal}>{t('detail.actions.globalSignOutModal.cancelButton')}</Button>
                <Button variant="primary" onClick={handleGlobalSignOut} loading={globalSignOut.isPending}>{t('detail.actions.globalSignOutModal.submitButton')}</Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('detail.actions.globalSignOutModal.description', { username })}
        </Modal>
      )}

      {/* Delete modal */}
      {activeModal === 'delete' && (
        <Modal
          visible
          onDismiss={closeModal}
          header={t('detail.actions.deleteModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={closeModal}>{t('detail.actions.deleteModal.cancelButton')}</Button>
                <Button variant="primary" onClick={handleDelete} loading={deleteUser.isPending} disabled={deleteConfirmation !== username}>{t('detail.actions.deleteModal.submitButton')}</Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="l">
            <Box>{t('detail.actions.deleteModal.description')}</Box>
            <FormField label={t('detail.actions.deleteModal.confirmLabel')}>
              <Input
                value={deleteConfirmation}
                onChange={({ detail }) => { setDeleteConfirmation(detail.value) }}
                placeholder={t('detail.actions.deleteModal.confirmPlaceholder')}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      )}
    </>
  )
}
