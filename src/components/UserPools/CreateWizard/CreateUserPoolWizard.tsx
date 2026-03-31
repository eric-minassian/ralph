import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Wizard from '@cloudscape-design/components/wizard'
import type { CreateUserPoolCommandInput } from '@aws-sdk/client-cognito-identity-provider'
import { useCreateUserPool } from '../../../api/hooks/useUserPools'
import { useNotifications } from '../../../hooks/useNotifications'
import { DEFAULT_FORM_STATE } from './types'
import type { WizardFormState } from './types'
import type { StepErrors } from './validation'
import {
  validateGeneralStep,
  validateSignInStep,
  validateSecurityStep,
  hasErrors,
} from './validation'
import { GeneralStep } from './GeneralStep'
import { SignInStep } from './SignInStep'
import { SecurityStep } from './SecurityStep'
import { DeliveryStep } from './DeliveryStep'
import { ReviewStep } from './ReviewStep'

function buildCreateInput(state: WizardFormState): CreateUserPoolCommandInput {
  const usernameAttributes: ('email' | 'phone_number')[] = []
  if (state.signIn.signInOptions.email) usernameAttributes.push('email')
  if (state.signIn.signInOptions.phone) usernameAttributes.push('phone_number')

  const autoVerifiedAttributes: ('email' | 'phone_number')[] = []
  if (state.signIn.requiredAttributes.email) autoVerifiedAttributes.push('email')
  if (state.signIn.requiredAttributes.phone) autoVerifiedAttributes.push('phone_number')

  const input: CreateUserPoolCommandInput = {
    PoolName: state.general.poolName.trim(),
    DeletionProtection: state.general.deletionProtection,
    Policies: {
      PasswordPolicy: {
        MinimumLength: state.security.passwordPolicy.minLength,
        RequireUppercase: state.security.passwordPolicy.requireUppercase,
        RequireLowercase: state.security.passwordPolicy.requireLowercase,
        RequireNumbers: state.security.passwordPolicy.requireNumbers,
        RequireSymbols: state.security.passwordPolicy.requireSymbols,
        TemporaryPasswordValidityDays: state.security.passwordPolicy.tempPasswordDays,
      },
    },
    MfaConfiguration: state.security.mfaConfiguration,
    AutoVerifiedAttributes:
      autoVerifiedAttributes.length > 0 ? autoVerifiedAttributes : undefined,
  }

  if (usernameAttributes.length > 0) {
    input.UsernameAttributes = usernameAttributes
  }

  if (state.delivery.emailSender === 'ses' && state.delivery.fromEmail.length > 0) {
    input.EmailConfiguration = {
      EmailSendingAccount: 'DEVELOPER',
      SourceArn: state.delivery.fromEmail,
      ReplyToEmailAddress:
        state.delivery.replyToEmail.length > 0
          ? state.delivery.replyToEmail
          : undefined,
    }
  }

  if (state.delivery.snsCallerArn.length > 0) {
    input.SmsConfiguration = {
      SnsCallerArn: state.delivery.snsCallerArn,
      ExternalId:
        state.delivery.externalId.length > 0
          ? state.delivery.externalId
          : undefined,
    }
  }

  return input
}

export function CreateUserPoolWizard() {
  const { t } = useTranslation('userPools')
  const navigate = useNavigate()
  const createUserPool = useCreateUserPool()
  const { addNotification } = useNotifications()

  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE)
  const [stepErrors, setStepErrors] = useState<StepErrors>({})

  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      let errors: StepErrors = {}
      switch (stepIndex) {
        case 0:
          errors = validateGeneralStep(formState.general, t)
          break
        case 1:
          errors = validateSignInStep(formState.signIn, t)
          break
        case 2:
          errors = validateSecurityStep(formState.security, t)
          break
        default:
          break
      }
      setStepErrors(errors)
      return !hasErrors(errors)
    },
    [formState, t],
  )

  const handleNavigate: React.ComponentProps<typeof Wizard>['onNavigate'] = ({
    detail,
  }) => {
    if (detail.requestedStepIndex > activeStepIndex) {
      if (!validateStep(activeStepIndex)) return
    }
    setStepErrors({})
    setActiveStepIndex(detail.requestedStepIndex)
  }

  const handleSubmit = () => {
    const input = buildCreateInput(formState)
    createUserPool.mutate(input, {
      onSuccess: (data) => {
        addNotification({
          id: `create-pool-${String(Date.now())}`,
          type: 'success',
          content: t('notifications.createSuccess', { name: formState.general.poolName }),
          dismissible: true,
        })
        const poolId = data.UserPool?.Id
        if (poolId) {
          void navigate({ to: '/user-pools/$userPoolId', params: { userPoolId: poolId } })
        } else {
          void navigate({ to: '/user-pools' })
        }
      },
      onError: () => {
        addNotification({
          id: `create-pool-error-${String(Date.now())}`,
          type: 'error',
          content: t('notifications.createError'),
          dismissible: true,
        })
      },
    })
  }

  const handleCancel = () => {
    void navigate({ to: '/user-pools' })
  }

  return (
    <Wizard
      i18nStrings={{
        stepNumberLabel: (stepNumber) =>
          t('create.stepNumber', { number: String(stepNumber) }),
        collapsedStepsLabel: (stepNumber, stepsCount) =>
          t('create.collapsedSteps', {
            step: String(stepNumber),
            count: String(stepsCount),
          }),
        navigationAriaLabel: t('create.stepNavigation'),
        cancelButton: t('create.cancelButton'),
        previousButton: t('create.previousButton'),
        nextButton: t('create.nextButton'),
        optional: t('create.optional'),
      }}
      onNavigate={handleNavigate}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      isLoadingNextStep={createUserPool.isPending}
      activeStepIndex={activeStepIndex}
      submitButtonText={t('create.submitButton')}
      steps={[
        {
          title: t('create.steps.general.title'),
          description: t('create.steps.general.description'),
          content: (
            <GeneralStep
              state={formState.general}
              errors={stepErrors}
              onChange={(general) => {
                setFormState((prev) => ({ ...prev, general }))
              }}
            />
          ),
        },
        {
          title: t('create.steps.signIn.title'),
          description: t('create.steps.signIn.description'),
          content: (
            <SignInStep
              state={formState.signIn}
              errors={stepErrors}
              onChange={(signIn) => {
                setFormState((prev) => ({ ...prev, signIn }))
              }}
            />
          ),
        },
        {
          title: t('create.steps.security.title'),
          description: t('create.steps.security.description'),
          content: (
            <SecurityStep
              state={formState.security}
              errors={stepErrors}
              onChange={(security) => {
                setFormState((prev) => ({ ...prev, security }))
              }}
            />
          ),
        },
        {
          title: t('create.steps.delivery.title'),
          description: t('create.steps.delivery.description'),
          content: (
            <DeliveryStep
              state={formState.delivery}
              onChange={(delivery) => {
                setFormState((prev) => ({ ...prev, delivery }))
              }}
            />
          ),
          isOptional: true,
        },
        {
          title: t('create.steps.review.title'),
          description: t('create.steps.review.description'),
          content: (
            <ReviewStep
              state={formState}
              onEditStep={setActiveStepIndex}
            />
          ),
        },
      ]}
    />
  )
}
