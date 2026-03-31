import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Box from '@cloudscape-design/components/box'
import type { UserPoolType } from '@aws-sdk/client-cognito-identity-provider'

interface PasswordPolicySectionProps {
  userPool: UserPoolType
}

export function PasswordPolicySection({ userPool }: PasswordPolicySectionProps) {
  const { t } = useTranslation('userPools')
  const policy = userPool.Policies?.PasswordPolicy

  return (
    <Container header={<Header variant="h2">{t('detail.passwordPolicy.title')}</Header>}>
      <ColumnLayout columns={3} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">{t('detail.passwordPolicy.minLength')}</Box>
          <div>{String(policy?.MinimumLength ?? 8)}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.passwordPolicy.requireUppercase')}</Box>
          <div>{policy?.RequireUppercase === true ? t('detail.passwordPolicy.yes') : t('detail.passwordPolicy.no')}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.passwordPolicy.requireLowercase')}</Box>
          <div>{policy?.RequireLowercase === true ? t('detail.passwordPolicy.yes') : t('detail.passwordPolicy.no')}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.passwordPolicy.requireNumbers')}</Box>
          <div>{policy?.RequireNumbers === true ? t('detail.passwordPolicy.yes') : t('detail.passwordPolicy.no')}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.passwordPolicy.requireSymbols')}</Box>
          <div>{policy?.RequireSymbols === true ? t('detail.passwordPolicy.yes') : t('detail.passwordPolicy.no')}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.passwordPolicy.tempPasswordDays')}</Box>
          <div>{t('detail.passwordPolicy.days', { count: policy?.TemporaryPasswordValidityDays ?? 7 })}</div>
        </div>
      </ColumnLayout>
    </Container>
  )
}
