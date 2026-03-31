import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Checkbox from '@cloudscape-design/components/checkbox'
import RadioGroup from '@cloudscape-design/components/radio-group'
import type { SecurityStepState } from './types'
import type { StepErrors } from './validation'

interface SecurityStepProps {
  state: SecurityStepState
  errors: StepErrors
  onChange: (state: SecurityStepState) => void
}

function toMfaConfig(value: string): 'OFF' | 'OPTIONAL' | 'ON' {
  if (value === 'ON') return 'ON'
  if (value === 'OPTIONAL') return 'OPTIONAL'
  return 'OFF'
}

export function SecurityStep({ state, errors, onChange }: SecurityStepProps) {
  const { t } = useTranslation('userPools')

  const updatePasswordPolicy = (
    field: keyof SecurityStepState['passwordPolicy'],
    value: boolean | number,
  ) => {
    onChange({
      ...state,
      passwordPolicy: { ...state.passwordPolicy, [field]: value },
    })
  }

  return (
    <SpaceBetween direction="vertical" size="l">
      <Container header={<Header variant="h2">{t('create.steps.security.passwordPolicy')}</Header>}>
        <SpaceBetween direction="vertical" size="l">
          <FormField
            label={t('create.steps.security.minLength')}
            description={t('create.steps.security.minLengthDescription')}
            errorText={errors.minLength}
          >
            <Input
              type="number"
              value={String(state.passwordPolicy.minLength)}
              inputMode="numeric"
              onChange={({ detail }) => {
                const parsed = parseInt(detail.value, 10)
                if (!Number.isNaN(parsed)) {
                  updatePasswordPolicy('minLength', parsed)
                }
              }}
            />
          </FormField>

          <SpaceBetween direction="vertical" size="xs">
            <Checkbox
              checked={state.passwordPolicy.requireUppercase}
              onChange={({ detail }) => {
                updatePasswordPolicy('requireUppercase', detail.checked)
              }}
            >
              {t('create.steps.security.requireUppercase')}
            </Checkbox>
            <Checkbox
              checked={state.passwordPolicy.requireLowercase}
              onChange={({ detail }) => {
                updatePasswordPolicy('requireLowercase', detail.checked)
              }}
            >
              {t('create.steps.security.requireLowercase')}
            </Checkbox>
            <Checkbox
              checked={state.passwordPolicy.requireNumbers}
              onChange={({ detail }) => {
                updatePasswordPolicy('requireNumbers', detail.checked)
              }}
            >
              {t('create.steps.security.requireNumbers')}
            </Checkbox>
            <Checkbox
              checked={state.passwordPolicy.requireSymbols}
              onChange={({ detail }) => {
                updatePasswordPolicy('requireSymbols', detail.checked)
              }}
            >
              {t('create.steps.security.requireSymbols')}
            </Checkbox>
          </SpaceBetween>

          <FormField
            label={t('create.steps.security.tempPasswordDays')}
            description={t('create.steps.security.tempPasswordDaysDescription')}
            errorText={errors.tempPasswordDays}
          >
            <Input
              type="number"
              value={String(state.passwordPolicy.tempPasswordDays)}
              inputMode="numeric"
              onChange={({ detail }) => {
                const parsed = parseInt(detail.value, 10)
                if (!Number.isNaN(parsed)) {
                  updatePasswordPolicy('tempPasswordDays', parsed)
                }
              }}
            />
          </FormField>
        </SpaceBetween>
      </Container>

      <Container header={<Header variant="h2">{t('create.steps.security.mfaConfiguration')}</Header>}>
        <SpaceBetween direction="vertical" size="l">
          <FormField>
            <RadioGroup
              value={state.mfaConfiguration}
              items={[
                { value: 'OFF', label: t('create.steps.security.mfaOff') },
                { value: 'OPTIONAL', label: t('create.steps.security.mfaOptional') },
                { value: 'ON', label: t('create.steps.security.mfaRequired') },
              ]}
              onChange={({ detail }) => {
                onChange({ ...state, mfaConfiguration: toMfaConfig(detail.value) })
              }}
            />
          </FormField>

          {state.mfaConfiguration !== 'OFF' && (
            <FormField
              label={t('create.steps.security.mfaMethods')}
              errorText={errors.mfaMethods}
            >
              <SpaceBetween direction="vertical" size="xs">
                <Checkbox
                  checked={state.mfaMethods.sms}
                  onChange={({ detail }) => {
                    onChange({
                      ...state,
                      mfaMethods: { ...state.mfaMethods, sms: detail.checked },
                    })
                  }}
                >
                  {t('create.steps.security.mfaSms')}
                </Checkbox>
                <Checkbox
                  checked={state.mfaMethods.totp}
                  onChange={({ detail }) => {
                    onChange({
                      ...state,
                      mfaMethods: { ...state.mfaMethods, totp: detail.checked },
                    })
                  }}
                >
                  {t('create.steps.security.mfaTotp')}
                </Checkbox>
              </SpaceBetween>
            </FormField>
          )}
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  )
}
