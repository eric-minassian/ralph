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
import AttributeEditor from '@cloudscape-design/components/attribute-editor'
import type { ResourceServerScopeType } from '@aws-sdk/client-cognito-identity-provider'
import { useDescribeResourceServer, useUpdateResourceServer, useDeleteResourceServer } from '../../../api/hooks/useResourceServers'
import { useNotifications } from '../../../hooks/useNotifications'
import { PermissionGate } from '../../PermissionGate'

interface ResourceServerDetailPageProps {
  userPoolId: string
  identifier: string
}

interface ScopeItem {
  name: string
  description: string
}

type ModalState =
  | { type: 'delete'; confirmText: string }
  | { type: 'edit'; name: string; scopes: ScopeItem[] }

function scopesToItems(scopes: ResourceServerScopeType[] | undefined): ScopeItem[] {
  if (!scopes) return []
  return scopes.map((s) => ({
    name: s.ScopeName ?? '',
    description: s.ScopeDescription ?? '',
  }))
}

export function ResourceServerDetailPage({ userPoolId, identifier }: ResourceServerDetailPageProps) {
  const { t } = useTranslation('resourceServers')
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const rsQuery = useDescribeResourceServer(userPoolId, identifier)
  const updateResourceServer = useUpdateResourceServer()
  const deleteResourceServer = useDeleteResourceServer()

  const [modal, setModal] = useState<ModalState | null>(null)

  const { data, isLoading, isError } = rsQuery
  const resourceServer = data?.ResourceServer

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
        <Box variant="p" padding="s">{t('detail.loading')}</Box>
      </Box>
    )
  }

  if (isError || !resourceServer) {
    return (
      <Alert
        type="error"
        header={t('detail.notFound')}
        action={
          <Button onClick={() => {
            void navigate({ to: '/user-pools/$userPoolId/resource-servers', params: { userPoolId } })
          }}>
            {t('detail.backToList')}
          </Button>
        }
      >
        {t('detail.notFoundDescription')}
      </Alert>
    )
  }

  const scopes = resourceServer.Scopes ?? []

  const handleDelete = () => {
    if (modal?.type !== 'delete' || modal.confirmText !== identifier) return
    deleteResourceServer.mutate(
      { UserPoolId: userPoolId, Identifier: identifier },
      {
        onSuccess: () => {
          addNotification({
            id: `delete-rs-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.deleteSuccess', { name: resourceServer.Name ?? identifier }),
            dismissible: true,
          })
          void navigate({ to: '/user-pools/$userPoolId/resource-servers', params: { userPoolId } })
        },
        onError: () => {
          addNotification({
            id: `delete-rs-err-${String(Date.now())}`,
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
    const scopeInputs = modal.scopes.map((s) => ({
      ScopeName: s.name.trim(),
      ScopeDescription: s.description.trim(),
    }))

    updateResourceServer.mutate(
      {
        UserPoolId: userPoolId,
        Identifier: identifier,
        Name: modal.name.trim(),
        Scopes: scopeInputs,
      },
      {
        onSuccess: () => {
          addNotification({
            id: `update-rs-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.updateSuccess', { name: modal.name.trim() }),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `update-rs-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.updateError'),
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
              <PermissionGate permission="UpdateResourceServer">
                <Button onClick={() => {
                  setModal({
                    type: 'edit',
                    name: resourceServer.Name ?? '',
                    scopes: scopesToItems(resourceServer.Scopes),
                  })
                }}>
                  {t('detail.editButton')}
                </Button>
              </PermissionGate>
              <PermissionGate permission="DeleteResourceServer">
                <Button onClick={() => { setModal({ type: 'delete', confirmText: '' }) }}>
                  {t('detail.deleteButton')}
                </Button>
              </PermissionGate>
            </SpaceBetween>
          }
        >
          {t('detail.title', { name: resourceServer.Name ?? identifier })}
        </Header>

        {/* General settings */}
        <Container header={<Header variant="h2">{t('detail.general.title')}</Header>}>
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">{t('detail.general.name')}</Box>
              <div>{resourceServer.Name ?? t('detail.general.noneSet')}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.identifier')}</Box>
              <div>{resourceServer.Identifier ?? t('detail.general.noneSet')}</div>
            </div>
          </ColumnLayout>
        </Container>

        {/* Scopes */}
        <Table
          columnDefinitions={[
            {
              id: 'scopeName',
              header: t('detail.scopes.name'),
              cell: (item: ResourceServerScopeType) => item.ScopeName ?? '—',
              isRowHeader: true,
            },
            {
              id: 'scopeDescription',
              header: t('detail.scopes.description'),
              cell: (item: ResourceServerScopeType) => item.ScopeDescription ?? '—',
            },
          ]}
          items={scopes}
          variant="embedded"
          header={<Header variant="h2">{t('detail.scopes.title')}</Header>}
          empty={
            <Box textAlign="center" color="text-body-secondary" padding="s">
              {t('detail.scopes.empty')}
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
                  loading={deleteResourceServer.isPending}
                  disabled={modal.confirmText !== identifier}
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
          size="large"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.edit.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEdit}
                  loading={updateResourceServer.isPending}
                  disabled={modal.name.trim().length === 0}
                >
                  {t('detail.edit.saveButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="l">
            <FormField label={t('detail.edit.name')}>
              <Input
                value={modal.name}
                onChange={({ detail }) => { setModal({ ...modal, name: detail.value }) }}
                placeholder={t('detail.edit.namePlaceholder')}
              />
            </FormField>
            <AttributeEditor
              onAddButtonClick={() => {
                setModal({ ...modal, scopes: [...modal.scopes, { name: '', description: '' }] })
              }}
              onRemoveButtonClick={({ detail: removeDetail }) => {
                const updated = [...modal.scopes]
                updated.splice(removeDetail.itemIndex, 1)
                setModal({ ...modal, scopes: updated })
              }}
              items={modal.scopes}
              addButtonText={t('detail.edit.addScope')}
              removeButtonText={t('common:remove')}
              definition={[
                {
                  label: t('detail.edit.scopeName'),
                  control: (item: ScopeItem, index: number) => (
                    <Input
                      value={item.name}
                      onChange={({ detail }) => {
                        const updated = [...modal.scopes]
                        const existing = updated[index]
                        if (existing) {
                          updated[index] = { ...existing, name: detail.value }
                          setModal({ ...modal, scopes: updated })
                        }
                      }}
                      placeholder={t('detail.edit.scopeNamePlaceholder')}
                    />
                  ),
                },
                {
                  label: t('detail.edit.scopeDescription'),
                  control: (item: ScopeItem, index: number) => (
                    <Input
                      value={item.description}
                      onChange={({ detail }) => {
                        const updated = [...modal.scopes]
                        const existing = updated[index]
                        if (existing) {
                          updated[index] = { ...existing, description: detail.value }
                          setModal({ ...modal, scopes: updated })
                        }
                      }}
                      placeholder={t('detail.edit.scopeDescriptionPlaceholder')}
                    />
                  ),
                },
              ]}
            />
          </SpaceBetween>
        </Modal>
      )}
    </>
  )
}
