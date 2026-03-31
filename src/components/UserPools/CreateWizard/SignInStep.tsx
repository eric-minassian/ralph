import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import FormField from '@cloudscape-design/components/form-field'
import Checkbox from '@cloudscape-design/components/checkbox'
import type { SignInStepState } from './types'
import type { StepErrors } from './validation'

interface SignInStepProps {
  state: SignInStepState
  errors: StepErrors
  onChange: (state: SignInStepState) => void
}

export function SignInStep({ state, errors, onChange }: SignInStepProps) {
  const { t } = useTranslation('userPools')

  return (
    <Container header={<Header variant="h2">{t('create.steps.signIn.title')}</Header>}>
      <SpaceBetween direction="vertical" size="l">
        <FormField
          label={t('create.steps.signIn.signInOptions')}
          description={t('create.steps.signIn.signInOptionsDescription')}
          errorText={errors.signInOptions}
        >
          <SpaceBetween direction="vertical" size="xs">
            <Checkbox
              checked={state.signInOptions.username}
              onChange={({ detail }) => {
                onChange({
                  ...state,
                  signInOptions: { ...state.signInOptions, username: detail.checked },
                })
              }}
            >
              {t('create.steps.signIn.username')}
            </Checkbox>
            <Checkbox
              checked={state.signInOptions.email}
              onChange={({ detail }) => {
                onChange({
                  ...state,
                  signInOptions: { ...state.signInOptions, email: detail.checked },
                })
              }}
            >
              {t('create.steps.signIn.email')}
            </Checkbox>
            <Checkbox
              checked={state.signInOptions.phone}
              onChange={({ detail }) => {
                onChange({
                  ...state,
                  signInOptions: { ...state.signInOptions, phone: detail.checked },
                })
              }}
            >
              {t('create.steps.signIn.phone')}
            </Checkbox>
          </SpaceBetween>
        </FormField>

        <FormField
          label={t('create.steps.signIn.requiredAttributes')}
          description={t('create.steps.signIn.requiredAttributesDescription')}
        >
          <SpaceBetween direction="vertical" size="xs">
            <Checkbox
              checked={state.requiredAttributes.email}
              onChange={({ detail }) => {
                onChange({
                  ...state,
                  requiredAttributes: { ...state.requiredAttributes, email: detail.checked },
                })
              }}
            >
              {t('create.steps.signIn.emailRequired')}
            </Checkbox>
            <Checkbox
              checked={state.requiredAttributes.phone}
              onChange={({ detail }) => {
                onChange({
                  ...state,
                  requiredAttributes: { ...state.requiredAttributes, phone: detail.checked },
                })
              }}
            >
              {t('create.steps.signIn.phoneRequired')}
            </Checkbox>
            <Checkbox
              checked={state.requiredAttributes.name}
              onChange={({ detail }) => {
                onChange({
                  ...state,
                  requiredAttributes: { ...state.requiredAttributes, name: detail.checked },
                })
              }}
            >
              {t('create.steps.signIn.nameRequired')}
            </Checkbox>
          </SpaceBetween>
        </FormField>
      </SpaceBetween>
    </Container>
  )
}
