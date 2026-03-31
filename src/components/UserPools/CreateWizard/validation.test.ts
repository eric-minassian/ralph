import { describe, it, expect } from 'vitest'
import {
  validateGeneralStep,
  validateSignInStep,
  validateSecurityStep,
  hasErrors,
} from './validation'
import type {
  GeneralStepState,
  SignInStepState,
  SecurityStepState,
} from './types'

const identity = (key: string) => key

describe('validateGeneralStep', () => {
  it('returns error when pool name is empty', () => {
    const state: GeneralStepState = {
      poolName: '',
      description: '',
      deletionProtection: 'INACTIVE',
    }
    const errors = validateGeneralStep(state, identity)
    expect(errors.poolName).toBeDefined()
  })

  it('returns error when pool name is only whitespace', () => {
    const state: GeneralStepState = {
      poolName: '   ',
      description: '',
      deletionProtection: 'INACTIVE',
    }
    const errors = validateGeneralStep(state, identity)
    expect(errors.poolName).toBeDefined()
  })

  it('returns error when pool name exceeds 128 characters', () => {
    const state: GeneralStepState = {
      poolName: 'a'.repeat(129),
      description: '',
      deletionProtection: 'INACTIVE',
    }
    const errors = validateGeneralStep(state, identity)
    expect(errors.poolName).toBeDefined()
  })

  it('returns no errors for valid pool name', () => {
    const state: GeneralStepState = {
      poolName: 'My User Pool',
      description: 'A test pool',
      deletionProtection: 'ACTIVE',
    }
    const errors = validateGeneralStep(state, identity)
    expect(hasErrors(errors)).toBe(false)
  })

  it('accepts pool name at exactly 128 characters', () => {
    const state: GeneralStepState = {
      poolName: 'a'.repeat(128),
      description: '',
      deletionProtection: 'INACTIVE',
    }
    const errors = validateGeneralStep(state, identity)
    expect(hasErrors(errors)).toBe(false)
  })
})

describe('validateSignInStep', () => {
  it('returns error when no sign-in option is selected', () => {
    const state: SignInStepState = {
      signInOptions: { username: false, email: false, phone: false },
      requiredAttributes: { email: true, phone: false, name: false },
    }
    const errors = validateSignInStep(state, identity)
    expect(errors.signInOptions).toBeDefined()
  })

  it('returns no errors when username is selected', () => {
    const state: SignInStepState = {
      signInOptions: { username: true, email: false, phone: false },
      requiredAttributes: { email: false, phone: false, name: false },
    }
    const errors = validateSignInStep(state, identity)
    expect(hasErrors(errors)).toBe(false)
  })

  it('returns no errors when email is selected', () => {
    const state: SignInStepState = {
      signInOptions: { username: false, email: true, phone: false },
      requiredAttributes: { email: true, phone: false, name: false },
    }
    const errors = validateSignInStep(state, identity)
    expect(hasErrors(errors)).toBe(false)
  })
})

describe('validateSecurityStep', () => {
  const validState: SecurityStepState = {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      tempPasswordDays: 7,
    },
    mfaConfiguration: 'OFF',
    mfaMethods: { sms: false, totp: false },
  }

  it('returns no errors for valid state with MFA off', () => {
    const errors = validateSecurityStep(validState, identity)
    expect(hasErrors(errors)).toBe(false)
  })

  it('returns error when minLength is below 8', () => {
    const state: SecurityStepState = {
      ...validState,
      passwordPolicy: { ...validState.passwordPolicy, minLength: 5 },
    }
    const errors = validateSecurityStep(state, identity)
    expect(errors.minLength).toBeDefined()
  })

  it('returns error when minLength exceeds 99', () => {
    const state: SecurityStepState = {
      ...validState,
      passwordPolicy: { ...validState.passwordPolicy, minLength: 100 },
    }
    const errors = validateSecurityStep(state, identity)
    expect(errors.minLength).toBeDefined()
  })

  it('returns error when tempPasswordDays is below 1', () => {
    const state: SecurityStepState = {
      ...validState,
      passwordPolicy: { ...validState.passwordPolicy, tempPasswordDays: 0 },
    }
    const errors = validateSecurityStep(state, identity)
    expect(errors.tempPasswordDays).toBeDefined()
  })

  it('returns error when tempPasswordDays exceeds 365', () => {
    const state: SecurityStepState = {
      ...validState,
      passwordPolicy: { ...validState.passwordPolicy, tempPasswordDays: 366 },
    }
    const errors = validateSecurityStep(state, identity)
    expect(errors.tempPasswordDays).toBeDefined()
  })

  it('returns error when MFA is enabled but no method selected', () => {
    const state: SecurityStepState = {
      ...validState,
      mfaConfiguration: 'OPTIONAL',
      mfaMethods: { sms: false, totp: false },
    }
    const errors = validateSecurityStep(state, identity)
    expect(errors.mfaMethods).toBeDefined()
  })

  it('returns no errors when MFA is required with TOTP selected', () => {
    const state: SecurityStepState = {
      ...validState,
      mfaConfiguration: 'ON',
      mfaMethods: { sms: false, totp: true },
    }
    const errors = validateSecurityStep(state, identity)
    expect(hasErrors(errors)).toBe(false)
  })

  it('returns no errors when MFA is optional with SMS selected', () => {
    const state: SecurityStepState = {
      ...validState,
      mfaConfiguration: 'OPTIONAL',
      mfaMethods: { sms: true, totp: false },
    }
    const errors = validateSecurityStep(state, identity)
    expect(hasErrors(errors)).toBe(false)
  })
})

describe('hasErrors', () => {
  it('returns false for empty object', () => {
    expect(hasErrors({})).toBe(false)
  })

  it('returns false when all values are undefined', () => {
    expect(hasErrors({ a: undefined, b: undefined })).toBe(false)
  })

  it('returns true when any value is a string', () => {
    expect(hasErrors({ a: undefined, b: 'error message' })).toBe(true)
  })
})
