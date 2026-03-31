import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Box from '@cloudscape-design/components/box'
import type { UserPoolType } from '@aws-sdk/client-cognito-identity-provider'

interface GeneralSectionProps {
  userPool: UserPoolType
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

export function GeneralSection({ userPool }: GeneralSectionProps) {
  const { t } = useTranslation('userPools')

  return (
    <Container header={<Header variant="h2">{t('detail.general.title')}</Header>}>
      <ColumnLayout columns={2} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">{t('detail.general.poolName')}</Box>
          <div>{userPool.Name ?? '—'}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.general.poolId')}</Box>
          <div>{userPool.Id ?? '—'}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.general.creationDate')}</Box>
          <div>{formatDate(userPool.CreationDate)}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.general.lastModified')}</Box>
          <div>{formatDate(userPool.LastModifiedDate)}</div>
        </div>
      </ColumnLayout>
    </Container>
  )
}
