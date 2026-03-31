import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import Table from '@cloudscape-design/components/table'
import Button from '@cloudscape-design/components/button'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Box from '@cloudscape-design/components/box'
import Modal from '@cloudscape-design/components/modal'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Badge from '@cloudscape-design/components/badge'
import type { AttributeType } from '@aws-sdk/client-cognito-identity-provider'
import { useAdminUpdateUserAttributes, useAdminDeleteUserAttributes } from '../../../api/hooks/useUsers'
import { useNotifications } from '../../../hooks/useNotifications'
import { PermissionGate } from '../../PermissionGate'

interface AttributesTabProps {
  userPoolId: string
  username: string
  attributes: AttributeType[]
}

// Standard Cognito attributes that are immutable (cannot be edited by admin)
const IMMUTABLE_ATTRIBUTES = new Set(['sub', 'identities'])

function isCustomAttribute(name: string): boolean {
  return name.startsWith('custom:')
}

function isMutableAttribute(name: string): boolean {
  if (IMMUTABLE_ATTRIBUTES.has(name)) return false
  return true
}

interface EditModalState {
  name: string
  value: string
}

interface DeleteModalState {
  name: string
}

interface AddModalState {
  name: string
  value: string
  nameError: string
}

export function AttributesTab({ userPoolId, username, attributes }: AttributesTabProps) {
  const { t } = useTranslation('users')
  const { addNotification } = useNotifications()
  const updateAttributes = useAdminUpdateUserAttributes()
  const deleteAttributes = useAdminDeleteUserAttributes()

  const [editModal, setEditModal] = useState<EditModalState | null>(null)
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null)
  const [addModal, setAddModal] = useState<AddModalState | null>(null)

  const handleEdit = (attr: AttributeType) => {
    setEditModal({ name: attr.Name ?? '', value: attr.Value ?? '' })
  }

  const handleSaveEdit = () => {
    if (!editModal) return
    updateAttributes.mutate(
      {
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: [{ Name: editModal.name, Value: editModal.value }],
      },
      {
        onSuccess: () => {
          addNotification({
            id: `update-attr-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.updateAttributeSuccess', { name: editModal.name }),
            dismissible: true,
          })
          setEditModal(null)
        },
        onError: () => {
          addNotification({
            id: `update-attr-error-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.updateAttributeError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleConfirmDelete = () => {
    if (!deleteModal) return
    deleteAttributes.mutate(
      {
        UserPoolId: userPoolId,
        Username: username,
        UserAttributeNames: [deleteModal.name],
      },
      {
        onSuccess: () => {
          addNotification({
            id: `delete-attr-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.deleteAttributeSuccess', { name: deleteModal.name }),
            dismissible: true,
          })
          setDeleteModal(null)
        },
        onError: () => {
          addNotification({
            id: `delete-attr-error-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.deleteAttributeError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleAddAttribute = () => {
    if (!addModal) return
    const trimmedName = addModal.name.trim()
    if (trimmedName.length === 0) {
      setAddModal({ ...addModal, nameError: t('validation:required') })
      return
    }

    updateAttributes.mutate(
      {
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: [{ Name: trimmedName, Value: addModal.value }],
      },
      {
        onSuccess: () => {
          addNotification({
            id: `add-attr-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.addAttributeSuccess', { name: trimmedName }),
            dismissible: true,
          })
          setAddModal(null)
        },
        onError: () => {
          addNotification({
            id: `add-attr-error-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.addAttributeError'),
            dismissible: true,
          })
        },
      },
    )
  }

  return (
    <>
      <Container
        header={
          <Header
            variant="h2"
            actions={
              <PermissionGate permission="AdminUpdateUserAttributes">
                <Button onClick={() => { setAddModal({ name: '', value: '', nameError: '' }) }}>
                  {t('detail.attributes.addButton')}
                </Button>
              </PermissionGate>
            }
          >
            {t('detail.attributes.title')}
          </Header>
        }
      >
        <Table
          columnDefinitions={[
            {
              id: 'name',
              header: t('detail.attributes.name'),
              cell: (item: AttributeType) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <span>{item.Name ?? '—'}</span>
                  {isCustomAttribute(item.Name ?? '') && (
                    <Badge color="blue">{t('detail.attributes.custom')}</Badge>
                  )}
                </SpaceBetween>
              ),
            },
            {
              id: 'value',
              header: t('detail.attributes.value'),
              cell: (item: AttributeType) => item.Value ?? '—',
            },
            {
              id: 'actions',
              header: t('detail.attributes.actions'),
              cell: (item: AttributeType) => {
                const name = item.Name ?? ''
                const mutable = isMutableAttribute(name)
                return (
                  <SpaceBetween direction="horizontal" size="xs">
                    {mutable ? (
                      <PermissionGate permission="AdminUpdateUserAttributes">
                        <Button
                          variant="inline-link"
                          onClick={() => { handleEdit(item) }}
                        >
                          {t('detail.attributes.editButton')}
                        </Button>
                      </PermissionGate>
                    ) : (
                      <Box color="text-status-inactive" fontSize="body-s">
                        {t('detail.attributes.immutable')}
                      </Box>
                    )}
                    {isCustomAttribute(name) && (
                      <PermissionGate permission="AdminDeleteUserAttributes">
                        <Button
                          variant="inline-link"
                          onClick={() => { setDeleteModal({ name }) }}
                        >
                          {t('detail.attributes.deleteButton')}
                        </Button>
                      </PermissionGate>
                    )}
                  </SpaceBetween>
                )
              },
            },
          ]}
          items={attributes}
          variant="embedded"
          empty={
            <Box textAlign="center" color="text-body-secondary" padding="s">
              {t('detail.attributes.empty')}
            </Box>
          }
        />
      </Container>

      {editModal !== null && (
        <Modal
          visible
          onDismiss={() => { setEditModal(null) }}
          header={t('detail.attributes.editModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setEditModal(null) }}>
                  {t('detail.attributes.editModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveEdit}
                  loading={updateAttributes.isPending}
                >
                  {t('detail.attributes.editModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="l">
            <FormField label={t('detail.attributes.editModal.name')}>
              <Input value={editModal.name} disabled />
            </FormField>
            <FormField label={t('detail.attributes.editModal.value')}>
              <Input
                value={editModal.value}
                onChange={({ detail }) => { setEditModal({ ...editModal, value: detail.value }) }}
                placeholder={t('detail.attributes.editModal.valuePlaceholder')}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      )}

      {deleteModal !== null && (
        <Modal
          visible
          onDismiss={() => { setDeleteModal(null) }}
          header={t('detail.attributes.deleteModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setDeleteModal(null) }}>
                  {t('detail.attributes.deleteModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmDelete}
                  loading={deleteAttributes.isPending}
                >
                  {t('detail.attributes.deleteModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('detail.attributes.deleteModal.description', { name: deleteModal.name })}
        </Modal>
      )}

      {addModal !== null && (
        <Modal
          visible
          onDismiss={() => { setAddModal(null) }}
          header={t('detail.attributes.addModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setAddModal(null) }}>
                  {t('detail.attributes.addModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddAttribute}
                  loading={updateAttributes.isPending}
                >
                  {t('detail.attributes.addModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="l">
            <FormField
              label={t('detail.attributes.addModal.name')}
              errorText={addModal.nameError.length > 0 ? addModal.nameError : undefined}
            >
              <Input
                value={addModal.name}
                onChange={({ detail }) => { setAddModal({ ...addModal, name: detail.value, nameError: '' }) }}
                placeholder={t('detail.attributes.addModal.namePlaceholder')}
              />
            </FormField>
            <FormField label={t('detail.attributes.addModal.value')}>
              <Input
                value={addModal.value}
                onChange={({ detail }) => { setAddModal({ ...addModal, value: detail.value }) }}
                placeholder={t('detail.attributes.addModal.valuePlaceholder')}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      )}
    </>
  )
}
