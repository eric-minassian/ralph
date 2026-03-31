import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Textarea from '@cloudscape-design/components/textarea'
import RadioGroup from '@cloudscape-design/components/radio-group'
import type { GeneralStepState } from './types'
import type { StepErrors } from './validation'

interface GeneralStepProps {
  state: GeneralStepState
  errors: StepErrors
  onChange: (state: GeneralStepState) => void
}

export function GeneralStep({ state, errors, onChange }: GeneralStepProps) {
  const { t } = useTranslation('userPools')

  return (
    <Container header={<Header variant="h2">{t('create.steps.general.title')}</Header>}>
      <SpaceBetween direction="vertical" size="l">
        <FormField
          label={t('create.steps.general.poolName')}
          constraintText={t('create.steps.general.poolNameConstraint')}
          errorText={errors.poolName}
        >
          <Input
            value={state.poolName}
            placeholder={t('create.steps.general.poolNamePlaceholder')}
            onChange={({ detail }) => {
              onChange({ ...state, poolName: detail.value })
            }}
          />
        </FormField>

        <FormField label={t('create.steps.general.description')}>
          <Textarea
            value={state.description}
            placeholder={t('create.steps.general.descriptionPlaceholder')}
            onChange={({ detail }) => {
              onChange({ ...state, description: detail.value })
            }}
          />
        </FormField>

        <FormField
          label={t('create.steps.general.deletionProtection')}
          description={t('create.steps.general.deletionProtectionDescription')}
        >
          <RadioGroup
            value={state.deletionProtection}
            items={[
              { value: 'ACTIVE', label: t('create.steps.general.deletionProtectionActive') },
              { value: 'INACTIVE', label: t('create.steps.general.deletionProtectionInactive') },
            ]}
            onChange={({ detail }) => {
              onChange({
                ...state,
                deletionProtection: detail.value === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
              })
            }}
          />
        </FormField>
      </SpaceBetween>
    </Container>
  )
}
