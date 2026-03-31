export interface GeneralStepState {
  poolName: string
  description: string
  deletionProtection: 'ACTIVE' | 'INACTIVE'
}

export interface SignInStepState {
  signInOptions: {
    username: boolean
    email: boolean
    phone: boolean
  }
  requiredAttributes: {
    email: boolean
    phone: boolean
    name: boolean
  }
}

export interface SecurityStepState {
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
    tempPasswordDays: number
  }
  mfaConfiguration: 'OFF' | 'OPTIONAL' | 'ON'
  mfaMethods: {
    sms: boolean
    totp: boolean
  }
}

export interface DeliveryStepState {
  emailSender: 'cognito' | 'ses'
  fromEmail: string
  replyToEmail: string
  snsCallerArn: string
  externalId: string
}

export interface WizardFormState {
  general: GeneralStepState
  signIn: SignInStepState
  security: SecurityStepState
  delivery: DeliveryStepState
}

export const DEFAULT_FORM_STATE: WizardFormState = {
  general: {
    poolName: '',
    description: '',
    deletionProtection: 'INACTIVE',
  },
  signIn: {
    signInOptions: {
      username: true,
      email: false,
      phone: false,
    },
    requiredAttributes: {
      email: true,
      phone: false,
      name: false,
    },
  },
  security: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      tempPasswordDays: 7,
    },
    mfaConfiguration: 'OFF',
    mfaMethods: {
      sms: false,
      totp: false,
    },
  },
  delivery: {
    emailSender: 'cognito',
    fromEmail: '',
    replyToEmail: '',
    snsCallerArn: '',
    externalId: '',
  },
}
