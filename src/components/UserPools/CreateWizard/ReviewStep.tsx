import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Button from '@cloudscape-design/components/button'
import KeyValuePairs from '@cloudscape-design/components/key-value-pairs'
import type { WizardFormState } from './types'

interface ReviewStepProps {
  state: WizardFormState
  onEditStep: (stepIndex: number) => void
}

export function ReviewStep({ state, onEditStep }: ReviewStepProps) {
  const { t } = useTranslation('userPools')

  const signInOptions = [
    state.signIn.signInOptions.username ? t('create.steps.signIn.username') : null,
    state.signIn.signInOptions.email ? t('create.steps.signIn.email') : null,
    state.signIn.signInOptions.phone ? t('create.steps.signIn.phone') : null,
  ].filter((v): v is string => v !== null)

  const requiredAttrs = [
    state.signIn.requiredAttributes.email ? t('create.steps.signIn.emailRequired') : null,
    state.signIn.requiredAttributes.phone ? t('create.steps.signIn.phoneRequired') : null,
    state.signIn.requiredAttributes.name ? t('create.steps.signIn.nameRequired') : null,
  ].filter((v): v is string => v !== null)

  const passwordRequirements = [
    state.security.passwordPolicy.requireUppercase ? t('create.steps.review.uppercase') : null,
    state.security.passwordPolicy.requireLowercase ? t('create.steps.review.lowercase') : null,
    state.security.passwordPolicy.requireNumbers ? t('create.steps.review.numbers') : null,
    state.security.passwordPolicy.requireSymbols ? t('create.steps.review.symbols') : null,
  ].filter((v): v is string => v !== null)

  const mfaMethods = [
    state.security.mfaMethods.sms ? t('create.steps.security.mfaSms') : null,
    state.security.mfaMethods.totp ? t('create.steps.security.mfaTotp') : null,
  ].filter((v): v is string => v !== null)

  const mfaLabel =
    state.security.mfaConfiguration === 'OFF'
      ? t('create.steps.security.mfaOff')
      : state.security.mfaConfiguration === 'OPTIONAL'
        ? t('create.steps.security.mfaOptional')
        : t('create.steps.security.mfaRequired')

  return (
    <SpaceBetween direction="vertical" size="l">
      <Container
        header={
          <Header
            variant="h2"
            actions={
              <Button onClick={() => { onEditStep(0) }}>
                {t('create.steps.review.edit')}
              </Button>
            }
          >
            {t('create.steps.review.generalSettings')}
          </Header>
        }
      >
        <KeyValuePairs
          columns={2}
          items={[
            {
              label: t('create.steps.review.poolName'),
              value: state.general.poolName,
            },
            {
              label: t('create.steps.review.descriptionLabel'),
              value: state.general.description || t('create.steps.review.none'),
            },
            {
              label: t('create.steps.review.deletionProtection'),
              value:
                state.general.deletionProtection === 'ACTIVE'
                  ? t('create.steps.general.deletionProtectionActive')
                  : t('create.steps.general.deletionProtectionInactive'),
            },
          ]}
        />
      </Container>

      <Container
        header={
          <Header
            variant="h2"
            actions={
              <Button onClick={() => { onEditStep(1) }}>
                {t('create.steps.review.edit')}
              </Button>
            }
          >
            {t('create.steps.review.signInSettings')}
          </Header>
        }
      >
        <KeyValuePairs
          columns={2}
          items={[
            {
              label: t('create.steps.review.signInOptions'),
              value: signInOptions.join(', ') || t('create.steps.review.none'),
            },
            {
              label: t('create.steps.review.requiredAttributes'),
              value: requiredAttrs.join(', ') || t('create.steps.review.none'),
            },
          ]}
        />
      </Container>

      <Container
        header={
          <Header
            variant="h2"
            actions={
              <Button onClick={() => { onEditStep(2) }}>
                {t('create.steps.review.edit')}
              </Button>
            }
          >
            {t('create.steps.review.securitySettings')}
          </Header>
        }
      >
        <KeyValuePairs
          columns={2}
          items={[
            {
              label: t('create.steps.review.passwordMinLength'),
              value: String(state.security.passwordPolicy.minLength),
            },
            {
              label: t('create.steps.review.passwordRequirements'),
              value: passwordRequirements.join(', ') || t('create.steps.review.none'),
            },
            {
              label: t('create.steps.review.tempPasswordDays'),
              value: t('create.steps.review.days', {
                count: state.security.passwordPolicy.tempPasswordDays,
              }),
            },
            {
              label: t('create.steps.review.mfaConfiguration'),
              value: mfaLabel,
            },
            ...(state.security.mfaConfiguration !== 'OFF'
              ? [
                  {
                    label: t('create.steps.review.mfaMethods'),
                    value: mfaMethods.join(', ') || t('create.steps.review.none'),
                  },
                ]
              : []),
          ]}
        />
      </Container>

      <Container
        header={
          <Header
            variant="h2"
            actions={
              <Button onClick={() => { onEditStep(3) }}>
                {t('create.steps.review.edit')}
              </Button>
            }
          >
            {t('create.steps.review.deliverySettings')}
          </Header>
        }
      >
        <KeyValuePairs
          columns={2}
          items={[
            {
              label: t('create.steps.review.emailSender'),
              value:
                state.delivery.emailSender === 'cognito'
                  ? t('create.steps.delivery.cognitoDefault')
                  : t('create.steps.delivery.sesConfig'),
            },
            ...(state.delivery.emailSender === 'ses'
              ? [
                  {
                    label: t('create.steps.review.fromEmail'),
                    value: state.delivery.fromEmail || t('create.steps.review.notConfigured'),
                  },
                  {
                    label: t('create.steps.review.replyToEmail'),
                    value: state.delivery.replyToEmail || t('create.steps.review.notConfigured'),
                  },
                ]
              : []),
            {
              label: t('create.steps.review.snsCallerArn'),
              value: state.delivery.snsCallerArn || t('create.steps.review.notConfigured'),
            },
          ]}
        />
      </Container>
    </SpaceBetween>
  )
}
