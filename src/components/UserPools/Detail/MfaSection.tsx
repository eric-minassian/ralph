import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Box from '@cloudscape-design/components/box'
import Button from '@cloudscape-design/components/button'
import Spinner from '@cloudscape-design/components/spinner'
import type { GetUserPoolMfaConfigCommandOutput } from '@aws-sdk/client-cognito-identity-provider'
import { PermissionGate } from '../../PermissionGate'
import { EditMfaModal } from './EditMfaModal'

interface MfaSectionProps {
  userPoolId: string
  mfaConfig: GetUserPoolMfaConfigCommandOutput | undefined
  isLoading: boolean
}

function getMfaModeLabel(mode: string | undefined, t: (key: string) => string): string {
  switch (mode) {
    case 'ON':
      return t('detail.mfa.required')
    case 'OPTIONAL':
      return t('detail.mfa.optional')
    default:
      return t('detail.mfa.off')
  }
}

function getMfaMethods(
  mfaConfig: GetUserPoolMfaConfigCommandOutput | undefined,
  t: (key: string) => string,
): string {
  if (!mfaConfig) return '—'
  const methods: string[] = []
  if (mfaConfig.SmsMfaConfiguration?.SmsConfiguration !== undefined ||
      mfaConfig.SmsMfaConfiguration?.SmsAuthenticationMessage !== undefined) {
    methods.push(t('detail.mfa.sms'))
  }
  if (mfaConfig.SoftwareTokenMfaConfiguration?.Enabled === true) {
    methods.push(t('detail.mfa.totp'))
  }
  return methods.length > 0 ? methods.join(', ') : t('detail.mfa.none')
}

export function MfaSection({ userPoolId, mfaConfig, isLoading }: MfaSectionProps) {
  const { t } = useTranslation('userPools')
  const [showEditModal, setShowEditModal] = useState(false)

  return (
    <>
      <Container
        header={
          <Header
            variant="h2"
            actions={
              <PermissionGate permission="SetUserPoolMfaConfig">
                <Button onClick={() => { setShowEditModal(true) }}>
                  {t('detail.editButton')}
                </Button>
              </PermissionGate>
            }
          >
            {t('detail.mfa.title')}
          </Header>
        }
      >
        {isLoading ? (
          <Spinner />
        ) : (
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">{t('detail.mfa.mode')}</Box>
              <div>{getMfaModeLabel(mfaConfig?.MfaConfiguration, t)}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.mfa.methods')}</Box>
              <div>{getMfaMethods(mfaConfig, t)}</div>
            </div>
          </ColumnLayout>
        )}
      </Container>

      {showEditModal && (
        <EditMfaModal
          userPoolId={userPoolId}
          currentConfig={mfaConfig}
          onDismiss={() => { setShowEditModal(false) }}
        />
      )}
    </>
  )
}
