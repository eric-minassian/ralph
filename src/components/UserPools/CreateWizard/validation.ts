import type {
  GeneralStepState,
  SignInStepState,
  SecurityStepState,
} from './types'

export interface StepErrors {
  [key: string]: string | undefined
}

export function validateGeneralStep(
  state: GeneralStepState,
  t: (key: string) => string,
): StepErrors {
  const errors: StepErrors = {}
  const trimmed = state.poolName.trim()
  if (trimmed.length === 0) {
    errors.poolName = t('validation:required')
  } else if (trimmed.length > 128) {
    errors.poolName = t('validation:maxLength', { max: '128' })
  }
  return errors
}

export function validateSignInStep(
  state: SignInStepState,
  t: (key: string, options?: Record<string, string>) => string,
): StepErrors {
  const errors: StepErrors = {}
  const { username, email, phone } = state.signInOptions
  if (!username && !email && !phone) {
    errors.signInOptions = t('userPools:create.steps.signIn.signInOptionRequired')
  }
  return errors
}

export function validateSecurityStep(
  state: SecurityStepState,
  t: (key: string) => string,
): StepErrors {
  const errors: StepErrors = {}
  const { minLength, tempPasswordDays } = state.passwordPolicy
  if (minLength < 8 || minLength > 99) {
    errors.minLength = t('userPools:create.steps.security.minLengthError')
  }
  if (tempPasswordDays < 1 || tempPasswordDays > 365) {
    errors.tempPasswordDays = t('userPools:create.steps.security.tempPasswordDaysError')
  }
  if (state.mfaConfiguration !== 'OFF' && !state.mfaMethods.sms && !state.mfaMethods.totp) {
    errors.mfaMethods = t('userPools:create.steps.security.mfaMethodRequired')
  }
  return errors
}

export function hasErrors(errors: StepErrors): boolean {
  return Object.values(errors).some((v) => v !== undefined)
}
