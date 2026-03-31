import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Box from '@cloudscape-design/components/box'
import StatusIndicator from '@cloudscape-design/components/status-indicator'
import type { UserPoolType } from '@aws-sdk/client-cognito-identity-provider'

interface DeletionProtectionSectionProps {
  userPool: UserPoolType
}

export function DeletionProtectionSection({ userPool }: DeletionProtectionSectionProps) {
  const { t } = useTranslation('userPools')
  const isActive = userPool.DeletionProtection === 'ACTIVE'

  return (
    <Container header={<Header variant="h2">{t('detail.deletionProtection.title')}</Header>}>
      <ColumnLayout columns={2} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">{t('detail.deletionProtection.status')}</Box>
          <div>
            <StatusIndicator type={isActive ? 'success' : 'warning'}>
              {isActive
                ? t('detail.deletionProtection.active')
                : t('detail.deletionProtection.inactive')}
            </StatusIndicator>
          </div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.deletionProtection.description')}</Box>
          <div>{t('detail.deletionProtection.description')}</div>
        </div>
      </ColumnLayout>
    </Container>
  )
}
