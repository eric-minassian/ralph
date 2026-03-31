import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Table from '@cloudscape-design/components/table'
import Header from '@cloudscape-design/components/header'
import Button from '@cloudscape-design/components/button'
import Box from '@cloudscape-design/components/box'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Modal from '@cloudscape-design/components/modal'
import StatusIndicator from '@cloudscape-design/components/status-indicator'
import type { DeviceType, AttributeType } from '@aws-sdk/client-cognito-identity-provider'
import {
  useAdminListDevices,
  useAdminForgetDevice,
  useAdminUpdateDeviceStatus,
} from '../../../api/hooks/useUsers'
import { useNotifications } from '../../../hooks/useNotifications'
import { PermissionGate } from '../../PermissionGate'

interface DevicesTabProps {
  userPoolId: string
  username: string
}

type ModalState =
  | { type: 'forget'; deviceKey: string }
  | { type: 'toggleStatus'; deviceKey: string; currentStatus: string }

function getDeviceAttribute(attributes: readonly AttributeType[], name: string): string | undefined {
  return attributes.find((a) => a.Name === name)?.Value
}

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

export function DevicesTab({ userPoolId, username }: DevicesTabProps) {
  const { t } = useTranslation('devices')
  const { addNotification } = useNotifications()

  const devicesQuery = useAdminListDevices({
    UserPoolId: userPoolId,
    Username: username,
    Limit: 60,
  })

  const forgetDevice = useAdminForgetDevice()
  const updateDeviceStatus = useAdminUpdateDeviceStatus()

  const [modal, setModal] = useState<ModalState | null>(null)

  const devices = devicesQuery.data?.Devices ?? []

  const handleForgetDevice = () => {
    if (modal?.type !== 'forget') return
    const deviceKey = modal.deviceKey
    forgetDevice.mutate(
      {
        UserPoolId: userPoolId,
        Username: username,
        DeviceKey: deviceKey,
      },
      {
        onSuccess: () => {
          addNotification({
            id: `forget-device-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.forgetSuccess'),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `forget-device-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.forgetError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleToggleStatus = () => {
    if (modal?.type !== 'toggleStatus') return
    const newStatus = modal.currentStatus === 'remembered' ? 'not_remembered' : 'remembered'
    updateDeviceStatus.mutate(
      {
        UserPoolId: userPoolId,
        Username: username,
        DeviceKey: modal.deviceKey,
        DeviceRememberedStatus: newStatus,
      },
      {
        onSuccess: () => {
          addNotification({
            id: `device-status-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.updateStatusSuccess'),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `device-status-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.updateStatusError'),
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
            id: 'deviceKey',
            header: t('deviceKey'),
            cell: (item: DeviceType) => item.DeviceKey ?? '—',
          },
          {
            id: 'deviceName',
            header: t('deviceName'),
            cell: (item: DeviceType) =>
              getDeviceAttribute(item.DeviceAttributes ?? [], 'device_name') ?? '—',
          },
          {
            id: 'lastIp',
            header: t('lastIp'),
            cell: (item: DeviceType) =>
              getDeviceAttribute(item.DeviceAttributes ?? [], 'last_ip_used') ?? '—',
          },
          {
            id: 'lastAuthenticated',
            header: t('lastAuthenticated'),
            cell: (item: DeviceType) => formatDate(item.DeviceLastAuthenticatedDate),
          },
          {
            id: 'created',
            header: t('created'),
            cell: (item: DeviceType) => formatDate(item.DeviceCreateDate),
          },
          {
            id: 'rememberedStatus',
            header: t('rememberedStatus'),
            cell: (item: DeviceType) => {
              const status = getDeviceAttribute(item.DeviceAttributes ?? [], 'device_status') ?? 'not_remembered'
              return (
                <StatusIndicator type={status === 'remembered' ? 'success' : 'stopped'}>
                  {status === 'remembered' ? t('remembered') : t('notRemembered')}
                </StatusIndicator>
              )
            },
          },
          {
            id: 'actions',
            header: '',
            cell: (item: DeviceType) => {
              const deviceKey = item.DeviceKey ?? ''
              const status = getDeviceAttribute(item.DeviceAttributes ?? [], 'device_status') ?? 'not_remembered'
              return (
                <SpaceBetween direction="horizontal" size="xs">
                  <PermissionGate permission="AdminUpdateDeviceStatus">
                    <Button
                      variant="inline-link"
                      onClick={() => { setModal({ type: 'toggleStatus', deviceKey, currentStatus: status }) }}
                    >
                      {t('toggleRemembered')}
                    </Button>
                  </PermissionGate>
                  <PermissionGate permission="AdminForgetDevice">
                    <Button
                      variant="inline-link"
                      onClick={() => { setModal({ type: 'forget', deviceKey }) }}
                    >
                      {t('forgetButton')}
                    </Button>
                  </PermissionGate>
                </SpaceBetween>
              )
            },
            width: 220,
          },
        ]}
        items={devices}
        loading={devicesQuery.isLoading}
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

      {/* Forget device modal */}
      {modal?.type === 'forget' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('forgetModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('forgetModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleForgetDevice}
                  loading={forgetDevice.isPending}
                >
                  {t('forgetModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('forgetModal.description', { deviceKey: modal.deviceKey })}
        </Modal>
      )}

      {/* Toggle device status modal */}
      {modal?.type === 'toggleStatus' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('statusModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('statusModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleToggleStatus}
                  loading={updateDeviceStatus.isPending}
                >
                  {t('statusModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('statusModal.description', { deviceKey: modal.deviceKey })}
        </Modal>
      )}
    </>
  )
}
