import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Header from '@cloudscape-design/components/header'
import Button from '@cloudscape-design/components/button'
import Tabs from '@cloudscape-design/components/tabs'
import Box from '@cloudscape-design/components/box'
import Spinner from '@cloudscape-design/components/spinner'
import Alert from '@cloudscape-design/components/alert'
import StatusIndicator from '@cloudscape-design/components/status-indicator'
import type { StatusIndicatorProps } from '@cloudscape-design/components/status-indicator'
import { useAdminGetUser } from '../../../api/hooks/useUsers'
import { OverviewTab } from './OverviewTab'
import { AttributesTab } from './AttributesTab'

interface UserDetailPageProps {
  userPoolId: string
  username: string
}

function statusIndicatorType(status: string | undefined): StatusIndicatorProps.Type {
  switch (status) {
    case 'CONFIRMED':
      return 'success'
    case 'FORCE_CHANGE_PASSWORD':
    case 'RESET_REQUIRED':
      return 'warning'
    case 'UNCONFIRMED':
      return 'pending'
    case 'ARCHIVED':
    case 'COMPROMISED':
      return 'error'
    case 'EXTERNAL_PROVIDER':
      return 'info'
    default:
      return 'stopped'
  }
}

export function UserDetailPage({ userPoolId, username }: UserDetailPageProps) {
  const { t } = useTranslation('users')
  const navigate = useNavigate()
  const { data, isLoading, isError } = useAdminGetUser(userPoolId, username)
  const [activeTabId, setActiveTabId] = useState('overview')

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
        <Box variant="p" margin={{ top: 's' }}>
          {t('detail.loading')}
        </Box>
      </Box>
    )
  }

  if (isError || !data) {
    return (
      <Alert
        type="error"
        header={t('detail.notFound')}
        action={
          <Button onClick={() => { void navigate({ to: '/user-pools/$userPoolId/users', params: { userPoolId } }) }}>
            {t('detail.backToList')}
          </Button>
        }
      >
        {t('detail.notFoundDescription')}
      </Alert>
    )
  }

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description={
          <StatusIndicator type={statusIndicatorType(data.UserStatus)}>
            {t(`status.${data.UserStatus ?? 'UNKNOWN'}`)}
          </StatusIndicator>
        }
      >
        {t('detail.title', { username: data.Username ?? '' })}
      </Header>

      <Tabs
        activeTabId={activeTabId}
        onChange={({ detail }) => { setActiveTabId(detail.activeTabId) }}
        tabs={[
          {
            id: 'overview',
            label: t('detail.tabs.overview'),
            content: <OverviewTab user={data} />,
          },
          {
            id: 'attributes',
            label: t('detail.tabs.attributes'),
            content: (
              <AttributesTab
                userPoolId={userPoolId}
                username={username}
                attributes={data.UserAttributes ?? []}
              />
            ),
          },
        ]}
      />
    </SpaceBetween>
  )
}
