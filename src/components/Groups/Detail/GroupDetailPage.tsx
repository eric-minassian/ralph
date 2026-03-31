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
import Textarea from '@cloudscape-design/components/textarea'
import Table from '@cloudscape-design/components/table'
import type { UserType, AttributeType } from '@aws-sdk/client-cognito-identity-provider'
import { useGetGroup, useUpdateGroup, useDeleteGroup, useListUsersInGroup } from '../../../api/hooks/useGroups'
import { useAdminAddUserToGroup, useAdminRemoveUserFromGroup } from '../../../api/hooks/useUsers'
import { useNotifications } from '../../../hooks/useNotifications'
import { PermissionGate } from '../../PermissionGate'

interface GroupDetailPageProps {
  userPoolId: string
  groupName: string
}

type ModalState =
  | { type: 'delete'; confirmText: string }
  | { type: 'edit'; description: string; precedence: string; roleArn: string }
  | { type: 'addUser'; username: string }
  | { type: 'removeUser'; username: string }

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

function findAttribute(attributes: readonly AttributeType[] | undefined, name: string): string | undefined {
  if (!attributes) return undefined
  return attributes.find((a) => a.Name === name)?.Value
}

export function GroupDetailPage({ userPoolId, groupName }: GroupDetailPageProps) {
  const { t } = useTranslation('groups')
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const groupQuery = useGetGroup(userPoolId, groupName)
  const membersQuery = useListUsersInGroup({ UserPoolId: userPoolId, GroupName: groupName, Limit: 60 })
  const updateGroup = useUpdateGroup()
  const deleteGroup = useDeleteGroup()
  const addUserToGroup = useAdminAddUserToGroup()
  const removeUserFromGroup = useAdminRemoveUserFromGroup()

  const [modal, setModal] = useState<ModalState | null>(null)

  const { data, isLoading, isError } = groupQuery
  const group = data?.Group

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
        <Box variant="p" padding="s">{t('detail.loading')}</Box>
      </Box>
    )
  }

  if (isError || !group) {
    return (
      <Alert
        type="error"
        header={t('detail.notFound')}
        action={
          <Button onClick={() => {
            void navigate({ to: '/user-pools/$userPoolId/groups', params: { userPoolId } })
          }}>
            {t('detail.backToList')}
          </Button>
        }
      >
        {t('detail.notFoundDescription')}
      </Alert>
    )
  }

  const members = membersQuery.data?.Users ?? []

  const handleDelete = () => {
    if (modal?.type !== 'delete' || modal.confirmText !== groupName) return
    deleteGroup.mutate(
      { UserPoolId: userPoolId, GroupName: groupName },
      {
        onSuccess: () => {
          addNotification({
            id: `delete-group-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.deleteSuccess', { name: groupName }),
            dismissible: true,
          })
          void navigate({ to: '/user-pools/$userPoolId/groups', params: { userPoolId } })
        },
        onError: () => {
          addNotification({
            id: `delete-group-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.deleteError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleEdit = () => {
    if (modal?.type !== 'edit') return
    const input: Record<string, unknown> = {
      UserPoolId: userPoolId,
      GroupName: groupName,
    }
    input.Description = modal.description
    const parsedPrecedence = parseInt(modal.precedence, 10)
    if (!Number.isNaN(parsedPrecedence) && parsedPrecedence >= 0) {
      input.Precedence = parsedPrecedence
    }
    if (modal.roleArn.trim().length > 0) {
      input.RoleArn = modal.roleArn.trim()
    }

    updateGroup.mutate(
      {
        UserPoolId: userPoolId,
        GroupName: groupName,
        Description: typeof input.Description === 'string' ? input.Description : undefined,
        Precedence: typeof input.Precedence === 'number' ? input.Precedence : undefined,
        RoleArn: typeof input.RoleArn === 'string' ? input.RoleArn : undefined,
      },
      {
        onSuccess: () => {
          addNotification({
            id: `update-group-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.updateSuccess', { name: groupName }),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `update-group-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.updateError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleAddUser = () => {
    if (modal?.type !== 'addUser' || modal.username.trim().length === 0) return
    const username = modal.username.trim()
    addUserToGroup.mutate(
      { UserPoolId: userPoolId, GroupName: groupName, Username: username },
      {
        onSuccess: () => {
          addNotification({
            id: `add-user-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.addUserSuccess', { username }),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `add-user-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.addUserError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleRemoveUser = () => {
    if (modal?.type !== 'removeUser') return
    const username = modal.username
    removeUserFromGroup.mutate(
      { UserPoolId: userPoolId, GroupName: groupName, Username: username },
      {
        onSuccess: () => {
          addNotification({
            id: `remove-user-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.removeUserSuccess', { username }),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `remove-user-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.removeUserError'),
            dismissible: true,
          })
        },
      },
    )
  }

  return (
    <>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <PermissionGate permission="UpdateGroup">
                <Button onClick={() => {
                  setModal({
                    type: 'edit',
                    description: group.Description ?? '',
                    precedence: group.Precedence !== undefined ? String(group.Precedence) : '',
                    roleArn: group.RoleArn ?? '',
                  })
                }}>
                  {t('detail.editButton')}
                </Button>
              </PermissionGate>
              <PermissionGate permission="DeleteGroup">
                <Button onClick={() => { setModal({ type: 'delete', confirmText: '' }) }}>
                  {t('detail.deleteButton')}
                </Button>
              </PermissionGate>
            </SpaceBetween>
          }
        >
          {t('detail.title', { name: groupName })}
        </Header>

        {/* General settings */}
        <Container header={<Header variant="h2">{t('detail.general.title')}</Header>}>
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">{t('detail.general.groupName')}</Box>
              <div>{group.GroupName ?? '—'}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.description')}</Box>
              <div>{group.Description ?? t('detail.general.noneSet')}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.precedence')}</Box>
              <div>{group.Precedence !== undefined ? String(group.Precedence) : t('detail.general.noneSet')}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.roleArn')}</Box>
              <div>{group.RoleArn ?? t('detail.general.noneSet')}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.creationDate')}</Box>
              <div>{formatDate(group.CreationDate)}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.lastModifiedDate')}</Box>
              <div>{formatDate(group.LastModifiedDate)}</div>
            </div>
          </ColumnLayout>
        </Container>

        {/* Members */}
        <Table
          columnDefinitions={[
            {
              id: 'username',
              header: t('detail.members.username'),
              cell: (item: UserType) => item.Username ?? '—',
              isRowHeader: true,
            },
            {
              id: 'email',
              header: t('detail.members.email'),
              cell: (item: UserType) => findAttribute(item.Attributes, 'email') ?? '—',
            },
            {
              id: 'status',
              header: t('detail.members.status'),
              cell: (item: UserType) => item.UserStatus ?? '—',
            },
            {
              id: 'enabled',
              header: t('detail.members.enabled'),
              cell: (item: UserType) => item.Enabled === true ? 'Enabled' : 'Disabled',
            },
            {
              id: 'actions',
              header: '',
              cell: (item: UserType) => (
                <PermissionGate permission="AdminRemoveUserFromGroup">
                  <Button
                    variant="inline-link"
                    onClick={() => { setModal({ type: 'removeUser', username: item.Username ?? '' }) }}
                  >
                    {t('detail.members.removeButton')}
                  </Button>
                </PermissionGate>
              ),
              width: 100,
            },
          ]}
          items={members}
          loading={membersQuery.isLoading}
          variant="embedded"
          header={
            <Header
              variant="h2"
              actions={
                <PermissionGate permission="AdminAddUserToGroup">
                  <Button onClick={() => { setModal({ type: 'addUser', username: '' }) }}>
                    {t('detail.members.addButton')}
                  </Button>
                </PermissionGate>
              }
            >
              {t('detail.members.title')}
            </Header>
          }
          empty={
            <Box textAlign="center" color="text-body-secondary" padding="s">
              {t('detail.members.empty')}
            </Box>
          }
        />
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
                  loading={deleteGroup.isPending}
                  disabled={modal.confirmText !== groupName}
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

      {/* Edit modal */}
      {modal?.type === 'edit' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.edit.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.edit.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEdit}
                  loading={updateGroup.isPending}
                >
                  {t('detail.edit.saveButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="l">
            <FormField label={t('detail.edit.description')}>
              <Textarea
                value={modal.description}
                onChange={({ detail }) => { setModal({ ...modal, description: detail.value }) }}
                placeholder={t('detail.edit.descriptionPlaceholder')}
              />
            </FormField>
            <FormField label={t('detail.edit.precedence')}>
              <Input
                value={modal.precedence}
                onChange={({ detail }) => { setModal({ ...modal, precedence: detail.value }) }}
                placeholder={t('detail.edit.precedencePlaceholder')}
                inputMode="numeric"
              />
            </FormField>
            <FormField label={t('detail.edit.roleArn')}>
              <Input
                value={modal.roleArn}
                onChange={({ detail }) => { setModal({ ...modal, roleArn: detail.value }) }}
                placeholder={t('detail.edit.roleArnPlaceholder')}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      )}

      {/* Add user modal */}
      {modal?.type === 'addUser' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.members.addModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.members.addModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddUser}
                  loading={addUserToGroup.isPending}
                  disabled={modal.username.trim().length === 0}
                >
                  {t('detail.members.addModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <FormField label={t('detail.members.addModal.username')}>
            <Input
              value={modal.username}
              onChange={({ detail }) => { setModal({ type: 'addUser', username: detail.value }) }}
              placeholder={t('detail.members.addModal.usernamePlaceholder')}
            />
          </FormField>
        </Modal>
      )}

      {/* Remove user modal */}
      {modal?.type === 'removeUser' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.members.removeModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.members.removeModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRemoveUser}
                  loading={removeUserFromGroup.isPending}
                >
                  {t('detail.members.removeModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('detail.members.removeModal.description', { username: modal.username, groupName })}
        </Modal>
      )}
    </>
  )
}
