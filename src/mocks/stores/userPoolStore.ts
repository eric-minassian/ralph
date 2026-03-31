import type {
  UserPoolType,
  UserPoolDescriptionType,
  UserPoolMfaType,
  SmsMfaConfigType,
  SoftwareTokenMfaConfigType,
} from '@aws-sdk/client-cognito-identity-provider'
import { BaseStore, StoreError } from './baseStore'

// ── Type guard helpers ───────────────────────────────────────────────

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((v): v is Record<string, unknown> => isRecord(v))
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v): v is string => isString(v))
}

function toDeletionProtection(value: unknown): 'ACTIVE' | 'INACTIVE' {
  if (value === 'ACTIVE') return 'ACTIVE'
  return 'INACTIVE'
}

function toMfaConfiguration(value: unknown): UserPoolMfaType {
  if (value === 'ON') return 'ON'
  if (value === 'OPTIONAL') return 'OPTIONAL'
  return 'OFF'
}

// ── Store helpers ────────────────────────────────────────────────────

function getUserPoolKey(pool: UserPoolType): string {
  return pool.Id ?? ''
}

function validateUniqueName(store: BaseStore<UserPoolType>, name: string, excludeId?: string): void {
  const existing = store.list().find(
    (p) => p.Name === name && p.Id !== excludeId,
  )
  if (existing) {
    throw new StoreError(
      'ResourceExistsException',
      `A user pool with name '${name}' already exists`,
    )
  }
}

const DEFAULT_PASSWORD_POLICY = {
  MinimumLength: 8,
  RequireUppercase: true,
  RequireLowercase: true,
  RequireNumbers: true,
  RequireSymbols: true,
  TemporaryPasswordValidityDays: 7,
}

// ── MFA config storage ──────────────────────────────────────────────

interface MfaConfigEntry {
  mfaConfiguration: UserPoolMfaType
  smsMfaConfiguration?: SmsMfaConfigType
  softwareTokenMfaConfiguration?: SoftwareTokenMfaConfigType
}

interface MfaConfigResult {
  MfaConfiguration: UserPoolMfaType
  SmsMfaConfiguration?: SmsMfaConfigType
  SoftwareTokenMfaConfiguration?: SoftwareTokenMfaConfigType
}

function parseSoftwareTokenMfaConfig(value: unknown): SoftwareTokenMfaConfigType | undefined {
  if (!isRecord(value)) return undefined
  return {
    Enabled: value.Enabled === true,
  }
}

function parseSmsMfaConfig(value: unknown): SmsMfaConfigType | undefined {
  if (!isRecord(value)) return undefined
  const smsAuth = isRecord(value.SmsAuthenticationMessage)
    ? undefined
    : isString(value.SmsAuthenticationMessage)
      ? value.SmsAuthenticationMessage
      : undefined
  const smsConfig = isRecord(value.SmsConfiguration) ? {
    SnsCallerArn: isString(value.SmsConfiguration.SnsCallerArn) ? value.SmsConfiguration.SnsCallerArn : undefined,
    ExternalId: isString(value.SmsConfiguration.ExternalId) ? value.SmsConfiguration.ExternalId : undefined,
    SnsRegion: isString(value.SmsConfiguration.SnsRegion) ? value.SmsConfiguration.SnsRegion : undefined,
  } : undefined
  return {
    SmsAuthenticationMessage: smsAuth,
    SmsConfiguration: smsConfig,
  }
}

// ── Main store ──────────────────────────────────────────────────────

class UserPoolStore {
  private readonly store = new BaseStore<UserPoolType>(getUserPoolKey)
  private readonly mfaConfigs = new Map<string, MfaConfigEntry>()

  create(input: Record<string, unknown>): UserPoolType {
    const name = input.PoolName
    if (!isString(name)) {
      throw new StoreError('InvalidParameterException', 'PoolName is required')
    }
    validateUniqueName(this.store, name)

    const now = new Date()
    const id = `us-east-1_${crypto.randomUUID().slice(0, 9)}`
    const pool: UserPoolType = {
      Id: id,
      Name: name,
      CreationDate: now,
      LastModifiedDate: now,
      Policies: {
        PasswordPolicy: DEFAULT_PASSWORD_POLICY,
      },
      DeletionProtection: toDeletionProtection(input.DeletionProtection),
      MfaConfiguration: toMfaConfiguration(input.MfaConfiguration),
      SchemaAttributes: [
        { Name: 'sub', AttributeDataType: 'String', Mutable: false, Required: true },
        { Name: 'email', AttributeDataType: 'String', Mutable: true, Required: true },
      ],
      AutoVerifiedAttributes: isStringArray(input.AutoVerifiedAttributes)
        ? input.AutoVerifiedAttributes
        : ['email'],
      EstimatedNumberOfUsers: 0,
    }

    return this.store.create(pool)
  }

  describe(userPoolId: string): UserPoolType {
    return this.store.get(userPoolId)
  }

  update(input: Record<string, unknown>): UserPoolType {
    const userPoolId = input.UserPoolId
    if (!isString(userPoolId)) {
      throw new StoreError('InvalidParameterException', 'UserPoolId is required')
    }

    return this.store.update(userPoolId, (existing) => {
      const updated: UserPoolType = { ...existing, LastModifiedDate: new Date() }
      if (input.DeletionProtection !== undefined) {
        updated.DeletionProtection = toDeletionProtection(input.DeletionProtection)
      }
      if (input.MfaConfiguration !== undefined) {
        updated.MfaConfiguration = toMfaConfiguration(input.MfaConfiguration)
      }
      if (isStringArray(input.AutoVerifiedAttributes)) {
        updated.AutoVerifiedAttributes = input.AutoVerifiedAttributes
      }
      return updated
    })
  }

  delete(userPoolId: string): void {
    const pool = this.store.get(userPoolId)
    if (pool.DeletionProtection === 'ACTIVE') {
      throw new StoreError(
        'InvalidParameterException',
        'Cannot delete a user pool with deletion protection enabled',
      )
    }
    this.store.delete(userPoolId)
    this.mfaConfigs.delete(userPoolId)
  }

  list(maxResults: number, nextToken?: string): {
    UserPools: UserPoolDescriptionType[]
    NextToken: string | undefined
  } {
    const result = this.store.listPaginated(maxResults, nextToken)
    const descriptions: UserPoolDescriptionType[] = result.items.map((p) => ({
      Id: p.Id,
      Name: p.Name,
      CreationDate: p.CreationDate,
      LastModifiedDate: p.LastModifiedDate,
      LambdaConfig: p.LambdaConfig,
    }))
    return { UserPools: descriptions, NextToken: result.nextToken }
  }

  addCustomAttributes(userPoolId: string, customAttributes: unknown): void {
    if (!isRecordArray(customAttributes)) {
      throw new StoreError('InvalidParameterException', 'CustomAttributes must be an array')
    }
    this.store.update(userPoolId, (existing) => {
      const schema = [...(existing.SchemaAttributes ?? [])]
      for (const attr of customAttributes) {
        const rawName = attr.Name
        if (!isString(rawName)) continue
        const fullName = rawName.startsWith('custom:') ? rawName : `custom:${rawName}`
        const duplicate = schema.find((s) => s.Name === fullName)
        if (duplicate) {
          throw new StoreError(
            'InvalidParameterException',
            `Attribute '${fullName}' already exists`,
          )
        }
        schema.push({
          Name: fullName,
          AttributeDataType: isString(attr.AttributeDataType) ? attr.AttributeDataType : 'String',
          Mutable: attr.Mutable === false ? false : true,
          Required: false,
        })
      }
      return { ...existing, SchemaAttributes: schema, LastModifiedDate: new Date() }
    })
  }

  getMfaConfig(userPoolId: string): MfaConfigResult {
    this.store.get(userPoolId)
    const config = this.mfaConfigs.get(userPoolId)
    return {
      MfaConfiguration: config?.mfaConfiguration ?? 'OFF',
      SmsMfaConfiguration: config?.smsMfaConfiguration,
      SoftwareTokenMfaConfiguration: config?.softwareTokenMfaConfiguration,
    }
  }

  setMfaConfig(input: Record<string, unknown>): MfaConfigResult {
    const userPoolId = input.UserPoolId
    if (!isString(userPoolId)) {
      throw new StoreError('InvalidParameterException', 'UserPoolId is required')
    }
    this.store.get(userPoolId)

    const mfaConfiguration = toMfaConfiguration(input.MfaConfiguration)
    const smsMfaConfiguration = parseSmsMfaConfig(input.SmsMfaConfiguration)
    const softwareTokenMfaConfiguration = parseSoftwareTokenMfaConfig(input.SoftwareTokenMfaConfiguration)

    this.mfaConfigs.set(userPoolId, {
      mfaConfiguration,
      smsMfaConfiguration,
      softwareTokenMfaConfiguration,
    })

    this.store.update(userPoolId, (existing) => ({
      ...existing,
      MfaConfiguration: mfaConfiguration,
      LastModifiedDate: new Date(),
    }))

    return {
      MfaConfiguration: mfaConfiguration,
      SmsMfaConfiguration: smsMfaConfiguration,
      SoftwareTokenMfaConfiguration: softwareTokenMfaConfiguration,
    }
  }

  clear(): void {
    this.store.clear()
    this.mfaConfigs.clear()
  }
}

export const userPoolStore = new UserPoolStore()
