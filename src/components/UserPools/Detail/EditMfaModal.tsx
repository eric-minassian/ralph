import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@cloudscape-design/components/modal'
import Box from '@cloudscape-design/components/box'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Button from '@cloudscape-design/components/button'
import FormField from '@cloudscape-design/components/form-field'
import RadioGroup from '@cloudscape-design/components/radio-group'
import Checkbox from '@cloudscape-design/components/checkbox'
import Alert from '@cloudscape-design/components/alert'
import type {
  GetUserPoolMfaConfigCommandOutput,
  UserPoolMfaType,
} from '@aws-sdk/client-cognito-identity-provider'

function isUserPoolMfaType(value: string): value is UserPoolMfaType {
  return value === 'OFF' || value === 'OPTIONAL' || value === 'ON'
}
import { useSetUserPoolMfaConfig } from '../../../api/hooks/useUserPools'
import { useNotifications } from '../../../hooks/useNotifications'

interface EditMfaModalProps {
  userPoolId: string
  currentConfig: GetUserPoolMfaConfigCommandOutput | undefined
  onDismiss: () => void
}

export function EditMfaModal({ userPoolId, currentConfig, onDismiss }: EditMfaModalProps) {
  const { t } = useTranslation('userPools')
  const setMfaConfig = useSetUserPoolMfaConfig()
  const { addNotification } = useNotifications()

  const [mfaMode, setMfaMode] = useState<UserPoolMfaType>(
    currentConfig?.MfaConfiguration ?? 'OFF',
  )
  const [smsEnabled, setSmsEnabled] = useState(
    currentConfig?.SmsMfaConfiguration?.SmsConfiguration !== undefined ||
    currentConfig?.SmsMfaConfiguration?.SmsAuthenticationMessage !== undefined,
  )
  const [totpEnabled, setTotpEnabled] = useState(
    currentConfig?.SoftwareTokenMfaConfiguration?.Enabled === true,
  )
  const [methodError, setMethodError] = useState('')

  const handleSave = () => {
    if (mfaMode !== 'OFF' && !smsEnabled && !totpEnabled) {
      setMethodError(t('detail.mfa.methodRequired'))
      return
    }
    setMethodError('')

    setMfaConfig.mutate(
      {
        UserPoolId: userPoolId,
        MfaConfiguration: mfaMode,
        SmsMfaConfiguration: smsEnabled
          ? { SmsConfiguration: { SnsCallerArn: 'arn:aws:sns:us-east-1:000000000000:cognito' } }
          : undefined,
        SoftwareTokenMfaConfiguration: {
          Enabled: totpEnabled,
        },
      },
      {
        onSuccess: () => {
          addNotification({
            id: `mfa-update-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.mfaUpdateSuccess'),
            dismissible: true,
          })
          onDismiss()
        },
        onError: () => {
          addNotification({
            id: `mfa-update-error-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.mfaUpdateError'),
            dismissible: true,
          })
        },
      },
    )
  }

  return (
    <Modal
      visible
      onDismiss={onDismiss}
      header={t('detail.mfa.editTitle')}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              {t('detail.mfa.cancelButton')}
            </Button>
            <Button variant="primary" onClick={handleSave} loading={setMfaConfig.isPending}>
              {t('detail.mfa.saveButton')}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="l">
        <Box>{t('detail.mfa.editDescription')}</Box>
        <FormField label={t('detail.mfa.modeLabel')}>
          <RadioGroup
            value={mfaMode}
            onChange={({ detail }) => {
              if (isUserPoolMfaType(detail.value)) {
                setMfaMode(detail.value)
              }
              setMethodError('')
            }}
            items={[
              { value: 'OFF', label: t('detail.mfa.mfaOff') },
              { value: 'OPTIONAL', label: t('detail.mfa.mfaOptional') },
              { value: 'ON', label: t('detail.mfa.mfaRequired') },
            ]}
          />
        </FormField>

        {mfaMode !== 'OFF' && (
          <FormField
            label={t('detail.mfa.methodsLabel')}
            errorText={methodError.length > 0 ? methodError : undefined}
          >
            <SpaceBetween size="xs">
              <Checkbox
                checked={smsEnabled}
                onChange={({ detail }) => {
                  setSmsEnabled(detail.checked)
                  setMethodError('')
                }}
              >
                {t('detail.mfa.mfaSms')}
              </Checkbox>
              <Checkbox
                checked={totpEnabled}
                onChange={({ detail }) => {
                  setTotpEnabled(detail.checked)
                  setMethodError('')
                }}
              >
                {t('detail.mfa.mfaTotp')}
              </Checkbox>
            </SpaceBetween>
          </FormField>
        )}

        {mfaMode !== 'OFF' && !smsEnabled && !totpEnabled && (
          <Alert type="warning">{t('detail.mfa.methodRequired')}</Alert>
        )}
      </SpaceBetween>
    </Modal>
  )
}
