import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Box from '@cloudscape-design/components/box'
import type { UserPoolType } from '@aws-sdk/client-cognito-identity-provider'

interface SignInSectionProps {
  userPool: UserPoolType
}

export function SignInSection({ userPool }: SignInSectionProps) {
  const { t } = useTranslation('userPools')

  const usernameAttributes = userPool.UsernameAttributes ?? []
  const autoVerifiedAttributes = userPool.AutoVerifiedAttributes ?? []

  const signInOptions = usernameAttributes.length > 0
    ? usernameAttributes.join(', ')
    : 'username'

  const autoVerified = autoVerifiedAttributes.length > 0
    ? autoVerifiedAttributes.join(', ')
    : '—'

  return (
    <Container header={<Header variant="h2">{t('detail.signIn.title')}</Header>}>
      <ColumnLayout columns={2} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">{t('detail.signIn.signInOptions')}</Box>
          <div>{signInOptions}</div>
        </div>
        <div>
          <Box variant="awsui-key-label">{t('detail.signIn.autoVerifiedAttributes')}</Box>
          <div>{autoVerified}</div>
        </div>
      </ColumnLayout>
    </Container>
  )
}
