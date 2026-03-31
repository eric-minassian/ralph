import type {
  UserPoolClientType,
  UserPoolClientDescription,
  TokenValidityUnitsType,
  ExplicitAuthFlowsType,
  OAuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider'
import { BaseStore, StoreError } from './baseStore'

// ── Type guard helpers ───────────────────────────────────────────────

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const VALID_AUTH_FLOWS = new Set<string>([
  'ADMIN_NO_SRP_AUTH', 'ALLOW_ADMIN_USER_PASSWORD_AUTH', 'ALLOW_CUSTOM_AUTH',
  'ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_USER_AUTH', 'ALLOW_USER_PASSWORD_AUTH',
  'ALLOW_USER_SRP_AUTH', 'CUSTOM_AUTH_FLOW_ONLY', 'USER_PASSWORD_AUTH',
])

function isExplicitAuthFlow(value: string): value is ExplicitAuthFlowsType {
  return VALID_AUTH_FLOWS.has(value)
}

function toExplicitAuthFlows(arr: string[]): ExplicitAuthFlowsType[] {
  return arr.filter(isExplicitAuthFlow)
}

const VALID_OAUTH_FLOWS = new Set<string>(['client_credentials', 'code', 'implicit'])

function isOAuthFlow(value: string): value is OAuthFlowType {
  return VALID_OAUTH_FLOWS.has(value)
}

function toOAuthFlows(arr: string[]): OAuthFlowType[] {
  return arr.filter(isOAuthFlow)
}

const VALID_TIME_UNITS = new Set<string>(['days', 'hours', 'minutes', 'seconds'])

function isTimeUnit(value: string): value is 'days' | 'hours' | 'minutes' | 'seconds' {
  return VALID_TIME_UNITS.has(value)
}

const VALID_PREVENT_USER_ERRORS = new Set<string>(['ENABLED', 'LEGACY'])

function isPreventUserExistenceErrors(value: string): value is 'ENABLED' | 'LEGACY' {
  return VALID_PREVENT_USER_ERRORS.has(value)
}

// ── Store helpers ────────────────────────────────────────────────────

function compositeKey(userPoolId: string, clientId: string): string {
  return `${userPoolId}#${clientId}`
}

function getClientKey(client: UserPoolClientType): string {
  return compositeKey(client.UserPoolId ?? '', client.ClientId ?? '')
}

let idCounter = 0

function generateClientId(): string {
  idCounter += 1
  return `client${String(idCounter).padStart(8, '0')}`
}

let secretIdCounter = 0

function generateSecretId(): string {
  secretIdCounter += 1
  return `secret${String(secretIdCounter).padStart(6, '0')}`
}

function generateSecretValue(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let result = ''
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function parseTokenValidityUnits(input: Record<string, unknown>): TokenValidityUnitsType {
  const units: TokenValidityUnitsType = {}
  const at = input.AccessToken
  if (isString(at) && isTimeUnit(at)) {
    units.AccessToken = at
  }
  const it = input.IdToken
  if (isString(it) && isTimeUnit(it)) {
    units.IdToken = it
  }
  const rt = input.RefreshToken
  if (isString(rt) && isTimeUnit(rt)) {
    units.RefreshToken = rt
  }
  return units
}

function applyClientFields(client: UserPoolClientType, input: Record<string, unknown>): void {
  if (isStringArray(input.ExplicitAuthFlows)) {
    client.ExplicitAuthFlows = toExplicitAuthFlows(input.ExplicitAuthFlows)
  }

  if (isStringArray(input.AllowedOAuthFlows)) {
    client.AllowedOAuthFlows = toOAuthFlows(input.AllowedOAuthFlows)
  }

  if (isStringArray(input.AllowedOAuthScopes)) {
    client.AllowedOAuthScopes = input.AllowedOAuthScopes
  }

  if (isBoolean(input.AllowedOAuthFlowsUserPoolClient)) {
    client.AllowedOAuthFlowsUserPoolClient = input.AllowedOAuthFlowsUserPoolClient
  }

  if (isStringArray(input.CallbackURLs)) {
    client.CallbackURLs = input.CallbackURLs
  }

  if (isStringArray(input.LogoutURLs)) {
    client.LogoutURLs = input.LogoutURLs
  }

  if (isNumber(input.AccessTokenValidity)) {
    client.AccessTokenValidity = input.AccessTokenValidity
  }

  if (isNumber(input.IdTokenValidity)) {
    client.IdTokenValidity = input.IdTokenValidity
  }

  if (isNumber(input.RefreshTokenValidity)) {
    client.RefreshTokenValidity = input.RefreshTokenValidity
  }

  if (isRecord(input.TokenValidityUnits)) {
    client.TokenValidityUnits = parseTokenValidityUnits(input.TokenValidityUnits)
  }

  if (isStringArray(input.ReadAttributes)) {
    client.ReadAttributes = input.ReadAttributes
  }

  if (isStringArray(input.WriteAttributes)) {
    client.WriteAttributes = input.WriteAttributes
  }

  if (isBoolean(input.PreventUserExistenceErrors)) {
    client.PreventUserExistenceErrors = input.PreventUserExistenceErrors ? 'ENABLED' : 'LEGACY'
  } else if (isString(input.PreventUserExistenceErrors) && isPreventUserExistenceErrors(input.PreventUserExistenceErrors)) {
    client.PreventUserExistenceErrors = input.PreventUserExistenceErrors
  }

  if (isBoolean(input.EnableTokenRevocation)) {
    client.EnableTokenRevocation = input.EnableTokenRevocation
  }
}

// ── Secret type ─────────────────────────────────────────────────────

interface ClientSecret {
  ClientSecretId: string
  ClientSecretValue: string
  ClientSecretCreateDate: Date
}

// ── Main store ──────────────────────────────────────────────────────

class AppClientStore {
  private readonly store = new BaseStore<UserPoolClientType>(getClientKey)
  private readonly secrets = new Map<string, ClientSecret[]>()

  create(userPoolId: string, input: Record<string, unknown>): UserPoolClientType {
    const clientName = input.ClientName
    if (!isString(clientName) || clientName.trim().length === 0) {
      throw new StoreError('InvalidParameterException', 'ClientName is required')
    }

    const clientId = generateClientId()
    const now = new Date()
    const client: UserPoolClientType = {
      ClientName: clientName.trim(),
      ClientId: clientId,
      UserPoolId: userPoolId,
      CreationDate: now,
      LastModifiedDate: now,
    }

    if (isBoolean(input.GenerateSecret) && input.GenerateSecret) {
      client.ClientSecret = generateSecretValue()
    }

    applyClientFields(client, input)

    this.store.create(client)
    this.secrets.set(compositeKey(userPoolId, clientId), [])
    return client
  }

  describe(userPoolId: string, clientId: string): UserPoolClientType {
    return this.store.get(compositeKey(userPoolId, clientId))
  }

  update(userPoolId: string, clientId: string, input: Record<string, unknown>): UserPoolClientType {
    const key = compositeKey(userPoolId, clientId)
    return this.store.update(key, (existing) => {
      const updated: UserPoolClientType = { ...existing, LastModifiedDate: new Date() }

      if (isString(input.ClientName)) {
        updated.ClientName = input.ClientName
      }

      applyClientFields(updated, input)

      if (isRecord(input.TokenValidityUnits)) {
        const baseUnits = existing.TokenValidityUnits ?? {}
        const merged: TokenValidityUnitsType = { ...baseUnits }
        const at = input.TokenValidityUnits.AccessToken
        if (isString(at) && isTimeUnit(at)) {
          merged.AccessToken = at
        }
        const it = input.TokenValidityUnits.IdToken
        if (isString(it) && isTimeUnit(it)) {
          merged.IdToken = it
        }
        const rt = input.TokenValidityUnits.RefreshToken
        if (isString(rt) && isTimeUnit(rt)) {
          merged.RefreshToken = rt
        }
        updated.TokenValidityUnits = merged
      }

      return updated
    })
  }

  delete(userPoolId: string, clientId: string): void {
    const key = compositeKey(userPoolId, clientId)
    this.store.delete(key)
    this.secrets.delete(key)
  }

  list(
    userPoolId: string,
    maxResults: number,
    nextToken?: string,
  ): { UserPoolClients: UserPoolClientDescription[]; NextToken: string | undefined } {
    const allClients = this.store
      .list()
      .filter((c) => c.UserPoolId === userPoolId)
    const startIndex = nextToken ? parseInt(nextToken, 10) : 0
    const endIndex = startIndex + maxResults
    const pageItems = allClients.slice(startIndex, endIndex)
    const newNextToken =
      endIndex < allClients.length ? String(endIndex) : undefined

    const descriptions: UserPoolClientDescription[] = pageItems.map((c) => ({
      ClientId: c.ClientId,
      ClientName: c.ClientName,
      UserPoolId: c.UserPoolId,
    }))

    return { UserPoolClients: descriptions, NextToken: newNextToken }
  }

  addSecret(userPoolId: string, clientId: string): ClientSecret {
    const key = compositeKey(userPoolId, clientId)
    this.store.get(key)
    const secretList = this.secrets.get(key)
    if (!secretList) {
      this.secrets.set(key, [])
    }
    const secret: ClientSecret = {
      ClientSecretId: generateSecretId(),
      ClientSecretValue: generateSecretValue(),
      ClientSecretCreateDate: new Date(),
    }
    const list = this.secrets.get(key)
    if (list) {
      list.push(secret)
    }
    return secret
  }

  deleteSecret(userPoolId: string, clientId: string, secretId: string): void {
    const key = compositeKey(userPoolId, clientId)
    this.store.get(key)
    const secretList = this.secrets.get(key)
    if (!secretList) {
      throw new StoreError('ResourceNotFoundException', `Secret '${secretId}' not found`)
    }
    const idx = secretList.findIndex((s) => s.ClientSecretId === secretId)
    if (idx === -1) {
      throw new StoreError('ResourceNotFoundException', `Secret '${secretId}' not found`)
    }
    secretList.splice(idx, 1)
  }

  listSecrets(
    userPoolId: string,
    clientId: string,
  ): { ClientSecrets: Array<{ ClientSecretId: string; ClientSecretCreateDate: Date }> } {
    const key = compositeKey(userPoolId, clientId)
    this.store.get(key)
    const secretList = this.secrets.get(key) ?? []
    return {
      ClientSecrets: secretList.map((s) => ({
        ClientSecretId: s.ClientSecretId,
        ClientSecretCreateDate: s.ClientSecretCreateDate,
      })),
    }
  }

  clear(): void {
    this.store.clear()
    this.secrets.clear()
    idCounter = 0
    secretIdCounter = 0
  }

  seed(userPoolId: string): void {
    this.create(userPoolId, {
      ClientName: 'WebApp',
      ExplicitAuthFlows: ['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'],
      AllowedOAuthFlows: ['code'],
      AllowedOAuthScopes: ['openid', 'email', 'profile'],
      AllowedOAuthFlowsUserPoolClient: true,
      CallbackURLs: ['https://app.example.com/callback'],
      LogoutURLs: ['https://app.example.com/logout'],
      AccessTokenValidity: 1,
      IdTokenValidity: 1,
      RefreshTokenValidity: 30,
      TokenValidityUnits: {
        AccessToken: 'hours',
        IdToken: 'hours',
        RefreshToken: 'days',
      },
      EnableTokenRevocation: true,
    })

    this.create(userPoolId, {
      ClientName: 'BackendService',
      GenerateSecret: true,
      ExplicitAuthFlows: ['ALLOW_ADMIN_USER_PASSWORD_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'],
      AllowedOAuthFlows: ['client_credentials'],
      AllowedOAuthScopes: ['api/read', 'api/write'],
      AllowedOAuthFlowsUserPoolClient: true,
      AccessTokenValidity: 15,
      IdTokenValidity: 15,
      RefreshTokenValidity: 7,
      TokenValidityUnits: {
        AccessToken: 'minutes',
        IdToken: 'minutes',
        RefreshToken: 'days',
      },
      EnableTokenRevocation: true,
      PreventUserExistenceErrors: true,
    })

    this.create(userPoolId, {
      ClientName: 'MobileApp',
      ExplicitAuthFlows: ['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_CUSTOM_AUTH'],
      AllowedOAuthFlows: ['code'],
      AllowedOAuthScopes: ['openid', 'email', 'phone'],
      AllowedOAuthFlowsUserPoolClient: true,
      CallbackURLs: ['myapp://callback'],
      LogoutURLs: ['myapp://logout'],
      AccessTokenValidity: 1,
      IdTokenValidity: 1,
      RefreshTokenValidity: 90,
      TokenValidityUnits: {
        AccessToken: 'hours',
        IdToken: 'hours',
        RefreshToken: 'days',
      },
      EnableTokenRevocation: true,
    })
  }
}

export const appClientStore = new AppClientStore()
