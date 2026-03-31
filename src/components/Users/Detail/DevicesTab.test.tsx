import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test-utils'
import { userStore } from '../../../mocks/stores/userStore'
import {
  useAdminListDevices,
  useAdminForgetDevice,
  useAdminUpdateDeviceStatus,
} from '../../../api/hooks/useUsers'
import { useTranslation } from 'react-i18next'

const POOL_ID = 'us-east-1_TestPool'
const USERNAME = 'testuser'

// ── Devices Tab Test Harness ───────────────────────────────────────

function DevicesHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const { t } = useTranslation('devices')
  const devicesQuery = useAdminListDevices({ UserPoolId: userPoolId, Username: username, Limit: 60 })
  const forgetDevice = useAdminForgetDevice()
  const updateStatus = useAdminUpdateDeviceStatus()

  const devices = devicesQuery.data?.Devices ?? []

  return (
    <div>
      {devicesQuery.isLoading && <span data-testid="loading">loading</span>}
      <span data-testid="device-count">{devices.length}</span>
      <ul>
        {devices.map((d) => {
          const attrs = d.DeviceAttributes ?? []
          const name = attrs.find((a) => a.Name === 'device_name')?.Value ?? ''
          const status = attrs.find((a) => a.Name === 'device_status')?.Value ?? ''
          return (
            <li key={d.DeviceKey} data-testid={`device-${d.DeviceKey ?? ''}`}>
              <span data-testid={`name-${d.DeviceKey ?? ''}`}>{name}</span>
              <span data-testid={`status-${d.DeviceKey ?? ''}`}>{status}</span>
              <button
                type="button"
                data-testid={`forget-${d.DeviceKey ?? ''}`}
                onClick={() => {
                  forgetDevice.mutate({
                    UserPoolId: userPoolId,
                    Username: username,
                    DeviceKey: d.DeviceKey ?? '',
                  })
                }}
              >
                {t('forgetButton')}
              </button>
              <button
                type="button"
                data-testid={`toggle-${d.DeviceKey ?? ''}`}
                onClick={() => {
                  const newStatus = status === 'remembered' ? 'not_remembered' : 'remembered'
                  updateStatus.mutate({
                    UserPoolId: userPoolId,
                    Username: username,
                    DeviceKey: d.DeviceKey ?? '',
                    DeviceRememberedStatus: newStatus,
                  })
                }}
              >
                {t('toggleRemembered')}
              </button>
            </li>
          )
        })}
      </ul>
      <span data-testid="forget-status">
        {forgetDevice.isSuccess ? 'forgotten' : forgetDevice.isPending ? 'forgetting' : 'idle'}
      </span>
      <span data-testid="update-status">
        {updateStatus.isSuccess ? 'updated' : updateStatus.isPending ? 'updating' : 'idle'}
      </span>
    </div>
  )
}

describe('DevicesTab', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('renders seed devices for a user', async () => {
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<DevicesHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('device-count')).toHaveTextContent('2')
    })
  })

  it('can forget a device via MSW', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<DevicesHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('device-count')).toHaveTextContent('2')
    })

    // Get the first device key from the store
    const devicesBefore = userStore.listDevices(POOL_ID, USERNAME, 10)
    const firstDeviceKey = devicesBefore.Devices[0]?.DeviceKey ?? ''

    await user.click(screen.getByTestId(`forget-${firstDeviceKey}`))

    await waitFor(() => {
      expect(screen.getByTestId('forget-status')).toHaveTextContent('forgotten')
    })

    // Verify store was updated
    const devicesAfter = userStore.listDevices(POOL_ID, USERNAME, 10)
    expect(devicesAfter.Devices).toHaveLength(1)
  })

  it('can update device status via MSW', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<DevicesHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('device-count')).toHaveTextContent('2')
    })

    // Get the first device key (status = remembered)
    const devicesBefore = userStore.listDevices(POOL_ID, USERNAME, 10)
    const firstDevice = devicesBefore.Devices[0]
    const firstDeviceKey = firstDevice?.DeviceKey ?? ''

    await user.click(screen.getByTestId(`toggle-${firstDeviceKey}`))

    await waitFor(() => {
      expect(screen.getByTestId('update-status')).toHaveTextContent('updated')
    })

    // Verify store was updated
    const devicesAfter = userStore.listDevices(POOL_ID, USERNAME, 10)
    const updatedDevice = devicesAfter.Devices.find((d) => d.DeviceKey === firstDeviceKey)
    const statusAttr = updatedDevice?.DeviceAttributes?.find((a) => a.Name === 'device_status')
    expect(statusAttr?.Value).toBe('not_remembered')
  })

  it('renders empty state when user has no devices', async () => {
    // Create user, then clear devices by forgetting them all
    userStore.create(POOL_ID, { Username: USERNAME })
    const allDevices = userStore.listDevices(POOL_ID, USERNAME, 100)
    for (const d of allDevices.Devices) {
      userStore.forgetDevice(POOL_ID, USERNAME, d.DeviceKey ?? '')
    }

    renderWithProviders(<DevicesHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('device-count')).toHaveTextContent('0')
    })
  })
})
