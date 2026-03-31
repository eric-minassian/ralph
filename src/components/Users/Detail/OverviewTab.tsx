import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Box from '@cloudscape-design/components/box'
import StatusIndicator from '@cloudscape-design/components/status-indicator'
import type { StatusIndicatorProps } from '@cloudscape-design/components/status-indicator'
import type { AdminGetUserCommandOutput } from '@aws-sdk/client-cognito-identity-provider'

interface OverviewTabProps {
  user: AdminGetUserCommandOutput
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

function findAttribute(user: AdminGetUserCommandOutput, name: string): string | undefined {
  return user.UserAttributes?.find((a) => a.Name === name)?.Value
}

export function OverviewTab({ user }: OverviewTabProps) {
  const { t } = useTranslation('users')

  const emailVerified = findAttribute(user, 'email_verified') === 'true'
  const phoneVerified = findAttribute(user, 'phone_number_verified') === 'true'

  return (
    <Container header={<Header variant="h2">{t('detail.overview.title')}</Header>}>
      <ColumnLayout columns={2} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">{t('detail.overview.username')}</Box>
          <div>{user.Username ?? '—'}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.overview.sub')}</Box>
          <div>{findAttribute(user, 'sub') ?? '—'}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.overview.status')}</Box>
          <div>
            <StatusIndicator type={statusIndicatorType(user.UserStatus)}>
              {t(`status.${user.UserStatus ?? 'UNKNOWN'}`)}
            </StatusIndicator>
          </div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.overview.enabled')}</Box>
          <div>
            <StatusIndicator type={user.Enabled === true ? 'success' : 'stopped'}>
              {t(`enabled.${String(user.Enabled ?? false)}`)}
            </StatusIndicator>
          </div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.overview.emailVerified')}</Box>
          <div>{emailVerified ? t('detail.overview.yes') : t('detail.overview.no')}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.overview.phoneVerified')}</Box>
          <div>{phoneVerified ? t('detail.overview.yes') : t('detail.overview.no')}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.overview.creationDate')}</Box>
          <div>{formatDate(user.UserCreateDate)}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.overview.lastModifiedDate')}</Box>
          <div>{formatDate(user.UserLastModifiedDate)}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.overview.mfaOptions')}</Box>
          <div>
            {user.MFAOptions && user.MFAOptions.length > 0
              ? user.MFAOptions.map((opt) => opt.DeliveryMedium).join(', ')
              : t('detail.overview.none')}
          </div>
        </div>
      </ColumnLayout>
    </Container>
  )
}
