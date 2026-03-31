import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import RadioGroup from '@cloudscape-design/components/radio-group'
import type { DeliveryStepState } from './types'

interface DeliveryStepProps {
  state: DeliveryStepState
  onChange: (state: DeliveryStepState) => void
}

export function DeliveryStep({ state, onChange }: DeliveryStepProps) {
  const { t } = useTranslation('userPools')

  return (
    <SpaceBetween direction="vertical" size="l">
      <Container header={<Header variant="h2">{t('create.steps.delivery.emailConfiguration')}</Header>}>
        <SpaceBetween direction="vertical" size="l">
          <FormField label={t('create.steps.delivery.emailSender')}>
            <RadioGroup
              value={state.emailSender}
              items={[
                { value: 'cognito', label: t('create.steps.delivery.cognitoDefault') },
                { value: 'ses', label: t('create.steps.delivery.sesConfig') },
              ]}
              onChange={({ detail }) => {
                onChange({
                  ...state,
                  emailSender: detail.value === 'ses' ? 'ses' : 'cognito',
                })
              }}
            />
          </FormField>

          {state.emailSender === 'ses' && (
            <>
              <FormField label={t('create.steps.delivery.fromEmail')}>
                <Input
                  value={state.fromEmail}
                  placeholder={t('create.steps.delivery.fromEmailPlaceholder')}
                  onChange={({ detail }) => {
                    onChange({ ...state, fromEmail: detail.value })
                  }}
                />
              </FormField>

              <FormField label={t('create.steps.delivery.replyToEmail')}>
                <Input
                  value={state.replyToEmail}
                  placeholder={t('create.steps.delivery.replyToEmailPlaceholder')}
                  onChange={({ detail }) => {
                    onChange({ ...state, replyToEmail: detail.value })
                  }}
                />
              </FormField>
            </>
          )}
        </SpaceBetween>
      </Container>

      <Container header={<Header variant="h2">{t('create.steps.delivery.smsConfiguration')}</Header>}>
        <SpaceBetween direction="vertical" size="l">
          <FormField label={t('create.steps.delivery.snsCallerArn')}>
            <Input
              value={state.snsCallerArn}
              placeholder={t('create.steps.delivery.snsCallerArnPlaceholder')}
              onChange={({ detail }) => {
                onChange({ ...state, snsCallerArn: detail.value })
              }}
            />
          </FormField>

          <FormField label={t('create.steps.delivery.externalId')}>
            <Input
              value={state.externalId}
              placeholder={t('create.steps.delivery.externalIdPlaceholder')}
              onChange={({ detail }) => {
                onChange({ ...state, externalId: detail.value })
              }}
            />
          </FormField>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  )
}
