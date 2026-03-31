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
import type { GroupType } from '@aws-sdk/client-cognito-identity-provider'
import {
  useAdminListGroupsForUser,
  useAdminAddUserToGroup,
  useAdminRemoveUserFromGroup,
} from '../../../api/hooks/useUsers'
import { useNotifications } from '../../../hooks/useNotifications'
import { PermissionGate } from '../../PermissionGate'

interface GroupsTabProps {
  userPoolId: string
  username: string
}

type ModalState =
  | { type: 'add'; groupName: string }
  | { type: 'remove'; groupName: string }

export function GroupsTab({ userPoolId, username }: GroupsTabProps) {
  const { t } = useTranslation('users')
  const { addNotification } = useNotifications()

  const groupsQuery = useAdminListGroupsForUser({
    UserPoolId: userPoolId,
    Username: username,
  })

  const addToGroup = useAdminAddUserToGroup()
  const removeFromGroup = useAdminRemoveUserFromGroup()

  const [modal, setModal] = useState<ModalState | null>(null)

  const groups = groupsQuery.data?.Groups ?? []

  const handleAddToGroup = () => {
    if (modal?.type !== 'add' || modal.groupName.trim().length === 0) return
    const groupName = modal.groupName.trim()
    addToGroup.mutate(
      {
        UserPoolId: userPoolId,
        Username: username,
        GroupName: groupName,
      },
      {
        onSuccess: () => {
          addNotification({
            id: `add-group-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.addToGroupSuccess', { groupName }),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `add-group-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.addToGroupError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleRemoveFromGroup = () => {
    if (modal?.type !== 'remove') return
    const groupName = modal.groupName
    removeFromGroup.mutate(
      {
        UserPoolId: userPoolId,
        Username: username,
        GroupName: groupName,
      },
      {
        onSuccess: () => {
          addNotification({
            id: `remove-group-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.removeFromGroupSuccess', { groupName }),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `remove-group-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.removeFromGroupError'),
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
            id: 'groupName',
            header: t('detail.groups.groupName'),
            cell: (item: GroupType) => item.GroupName ?? '—',
          },
          {
            id: 'description',
            header: t('detail.groups.description'),
            cell: (item: GroupType) => item.Description ?? '—',
          },
          {
            id: 'precedence',
            header: t('detail.groups.precedence'),
            cell: (item: GroupType) => item.Precedence !== undefined ? String(item.Precedence) : '—',
          },
          {
            id: 'creationDate',
            header: t('detail.groups.creationDate'),
            cell: (item: GroupType) => {
              if (!item.CreationDate) return '—'
              return new Date(item.CreationDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            },
          },
          {
            id: 'actions',
            header: '',
            cell: (item: GroupType) => (
              <PermissionGate permission="AdminRemoveUserFromGroup">
                <Button
                  variant="inline-link"
                  onClick={() => { setModal({ type: 'remove', groupName: item.GroupName ?? '' }) }}
                >
                  {t('detail.groups.removeButton')}
                </Button>
              </PermissionGate>
            ),
            width: 100,
          },
        ]}
        items={groups}
        loading={groupsQuery.isLoading}
        variant="embedded"
        header={
          <Header
            variant="h2"
            actions={
              <PermissionGate permission="AdminAddUserToGroup">
                <Button onClick={() => { setModal({ type: 'add', groupName: '' }) }}>
                  {t('detail.groups.addButton')}
                </Button>
              </PermissionGate>
            }
          >
            {t('detail.groups.title')}
          </Header>
        }
        empty={
          <Box textAlign="center" color="text-body-secondary" padding="s">
            {t('detail.groups.empty')}
          </Box>
        }
      />

      {/* Add to group modal */}
      {modal?.type === 'add' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.groups.addModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.groups.addModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddToGroup}
                  loading={addToGroup.isPending}
                  disabled={modal.groupName.trim().length === 0}
                >
                  {t('detail.groups.addModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <FormField label={t('detail.groups.addModal.groupName')}>
            <Input
              value={modal.groupName}
              onChange={({ detail }) => { setModal({ type: 'add', groupName: detail.value }) }}
              placeholder={t('detail.groups.addModal.groupNamePlaceholder')}
            />
          </FormField>
        </Modal>
      )}

      {/* Remove from group modal */}
      {modal?.type === 'remove' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.groups.removeModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.groups.removeModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRemoveFromGroup}
                  loading={removeFromGroup.isPending}
                >
                  {t('detail.groups.removeModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('detail.groups.removeModal.description', { groupName: modal.groupName })}
        </Modal>
      )}
    </>
  )
}
