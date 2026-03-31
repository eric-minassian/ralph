import type {
  UserType,
  AttributeType,
  GroupType,
  AuthEventType,
  FeedbackValueType,
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

function isBool(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

// ── Composite key: userPoolId + username ─────────────────────────────

interface MfaPreference {
  smsEnabled: boolean
  smsPreferred: boolean
  softwareTokenEnabled: boolean
  softwareTokenPreferred: boolean
}

interface StoredUser {
  userPoolId: string
  user: UserType
  groups: Set<string>
  mfaPreference: MfaPreference
  authEvents: AuthEventType[]
}

function getStoredUserKey(stored: StoredUser): string {
  return `${stored.userPoolId}#${stored.user.Username ?? ''}`
}

function compositeKey(userPoolId: string, username: string): string {
  return `${userPoolId}#${username}`
}

// ── Helper to parse attributes from raw input ───────────────────────

function parseAttributes(value: unknown): AttributeType[] {
  if (!isRecordArray(value)) return []
  return value
    .filter((a): a is Record<string, unknown> & { Name: string } => isString(a.Name))
    .map((a) => ({
      Name: a.Name,
      Value: isString(a.Value) ? a.Value : undefined,
    }))
}

function findAttribute(attributes: readonly AttributeType[], name: string): string | undefined {
  return attributes.find((a) => a.Name === name)?.Value
}

// ── Main store ──────────────────────────────────────────────────────

class UserStore {
  private readonly store = new BaseStore<StoredUser>(getStoredUserKey)

  create(userPoolId: string, input: Record<string, unknown>): UserType {
    const username = input.Username
    if (!isString(username)) {
      throw new StoreError('InvalidParameterException', 'Username is required')
    }

    const key = compositeKey(userPoolId, username)
    if (this.store.has(key)) {
      throw new StoreError('UsernameExistsException', `User account already exists for username: ${username}`)
    }

    const now = new Date()
    const userAttributes = parseAttributes(input.UserAttributes)

    // Auto-generate sub if not provided
    if (!findAttribute(userAttributes, 'sub')) {
      userAttributes.unshift({ Name: 'sub', Value: crypto.randomUUID() })
    }

    const temporaryPassword = isString(input.TemporaryPassword) ? input.TemporaryPassword : undefined
    const messageAction = isString(input.MessageAction) ? input.MessageAction : undefined

    const user: UserType = {
      Username: username,
      Attributes: userAttributes,
      UserCreateDate: now,
      UserLastModifiedDate: now,
      Enabled: true,
      UserStatus: messageAction === 'SUPPRESS' ? 'FORCE_CHANGE_PASSWORD' : 'FORCE_CHANGE_PASSWORD',
    }

    // If no temporary password set and auto-generation not suppressed
    if (temporaryPassword === undefined) {
      user.UserStatus = 'FORCE_CHANGE_PASSWORD'
    }

    const stored: StoredUser = {
      userPoolId,
      user,
      groups: new Set(),
      mfaPreference: {
        smsEnabled: false,
        smsPreferred: false,
        softwareTokenEnabled: false,
        softwareTokenPreferred: false,
      },
      authEvents: createSeedAuthEvents(),
    }

    this.store.create(stored)
    return user
  }

  getUser(userPoolId: string, username: string): UserType {
    const key = compositeKey(userPoolId, username)
    return this.store.get(key).user
  }

  deleteUser(userPoolId: string, username: string): void {
    const key = compositeKey(userPoolId, username)
    this.store.delete(key)
  }

  enableUser(userPoolId: string, username: string): void {
    const key = compositeKey(userPoolId, username)
    this.store.update(key, (stored) => ({
      ...stored,
      user: { ...stored.user, Enabled: true, UserLastModifiedDate: new Date() },
    }))
  }

  disableUser(userPoolId: string, username: string): void {
    const key = compositeKey(userPoolId, username)
    this.store.update(key, (stored) => ({
      ...stored,
      user: { ...stored.user, Enabled: false, UserLastModifiedDate: new Date() },
    }))
  }

  confirmSignUp(userPoolId: string, username: string): void {
    const key = compositeKey(userPoolId, username)
    this.store.update(key, (stored) => ({
      ...stored,
      user: {
        ...stored.user,
        UserStatus: 'CONFIRMED',
        UserLastModifiedDate: new Date(),
      },
    }))
  }

  resetPassword(userPoolId: string, username: string): void {
    const key = compositeKey(userPoolId, username)
    this.store.update(key, (stored) => ({
      ...stored,
      user: {
        ...stored.user,
        UserStatus: 'RESET_REQUIRED',
        UserLastModifiedDate: new Date(),
      },
    }))
  }

  setPassword(userPoolId: string, username: string, _password: string, permanent: boolean): void {
    const key = compositeKey(userPoolId, username)
    this.store.update(key, (stored) => ({
      ...stored,
      user: {
        ...stored.user,
        UserStatus: permanent ? 'CONFIRMED' : 'FORCE_CHANGE_PASSWORD',
        UserLastModifiedDate: new Date(),
      },
    }))
  }

  updateAttributes(userPoolId: string, username: string, attributes: AttributeType[]): void {
    const key = compositeKey(userPoolId, username)
    this.store.update(key, (stored) => {
      const existingAttrs = [...(stored.user.Attributes ?? [])]
      for (const attr of attributes) {
        const idx = existingAttrs.findIndex((a) => a.Name === attr.Name)
        if (idx >= 0) {
          existingAttrs[idx] = attr
        } else {
          existingAttrs.push(attr)
        }
      }
      return {
        ...stored,
        user: { ...stored.user, Attributes: existingAttrs, UserLastModifiedDate: new Date() },
      }
    })
  }

  deleteAttributes(userPoolId: string, username: string, attributeNames: string[]): void {
    const key = compositeKey(userPoolId, username)
    this.store.update(key, (stored) => {
      const existingAttrs = (stored.user.Attributes ?? []).filter(
        (a) => !attributeNames.includes(a.Name ?? ''),
      )
      return {
        ...stored,
        user: { ...stored.user, Attributes: existingAttrs, UserLastModifiedDate: new Date() },
      }
    })
  }

  globalSignOut(userPoolId: string, username: string): void {
    // Validate user exists
    const key = compositeKey(userPoolId, username)
    this.store.get(key)
  }

  setMfaPreference(
    userPoolId: string,
    username: string,
    sms: unknown,
    softwareToken: unknown,
  ): void {
    const key = compositeKey(userPoolId, username)
    this.store.update(key, (stored) => {
      const pref = { ...stored.mfaPreference }
      if (isRecord(sms)) {
        pref.smsEnabled = isBool(sms.Enabled) ? sms.Enabled : false
        pref.smsPreferred = isBool(sms.PreferredMfa) ? sms.PreferredMfa : false
      }
      if (isRecord(softwareToken)) {
        pref.softwareTokenEnabled = isBool(softwareToken.Enabled) ? softwareToken.Enabled : false
        pref.softwareTokenPreferred = isBool(softwareToken.PreferredMfa) ? softwareToken.PreferredMfa : false
      }
      return { ...stored, mfaPreference: pref }
    })
  }

  // ── Group membership ──────────────────────────────────────────────

  addToGroup(userPoolId: string, username: string, groupName: string): void {
    const key = compositeKey(userPoolId, username)
    this.store.update(key, (stored) => {
      stored.groups.add(groupName)
      return stored
    })
  }

  removeFromGroup(userPoolId: string, username: string, groupName: string): void {
    const key = compositeKey(userPoolId, username)
    this.store.update(key, (stored) => {
      stored.groups.delete(groupName)
      return stored
    })
  }

  listGroupsForUser(userPoolId: string, username: string): GroupType[] {
    const key = compositeKey(userPoolId, username)
    const stored = this.store.get(key)
    return [...stored.groups].map((groupName) => ({
      GroupName: groupName,
      UserPoolId: userPoolId,
    }))
  }

  // ── Auth events ──────────────────────────────────────────────────

  getMfaPreference(userPoolId: string, username: string): MfaPreference {
    const key = compositeKey(userPoolId, username)
    return this.store.get(key).mfaPreference
  }

  listAuthEvents(
    userPoolId: string,
    username: string,
    maxResults: number,
    nextToken?: string,
  ): { AuthEvents: AuthEventType[]; NextToken: string | undefined } {
    const key = compositeKey(userPoolId, username)
    const stored = this.store.get(key)
    const events = stored.authEvents
    const startIndex = nextToken ? parseInt(nextToken, 10) : 0
    const endIndex = startIndex + maxResults
    const page = events.slice(startIndex, endIndex)
    const newNextToken = endIndex < events.length ? String(endIndex) : undefined
    return { AuthEvents: page, NextToken: newNextToken }
  }

  updateAuthEventFeedback(
    userPoolId: string,
    username: string,
    eventId: string,
    feedbackValue: string,
  ): void {
    const key = compositeKey(userPoolId, username)
    const typedFeedback = feedbackValue === 'Valid' || feedbackValue === 'Invalid'
      ? feedbackValue satisfies FeedbackValueType
      : 'Valid' satisfies FeedbackValueType
    this.store.update(key, (stored) => {
      const events: AuthEventType[] = stored.authEvents.map((event) => {
        if (event.EventId === eventId) {
          const updated: AuthEventType = {
            ...event,
            EventFeedback: {
              FeedbackValue: typedFeedback,
              Provider: 'Admin',
              FeedbackDate: new Date(),
            },
          }
          return updated
        }
        return event
      })
      return { ...stored, authEvents: events }
    })
  }

  // ── List with pagination ──────────────────────────────────────────

  listUsers(
    userPoolId: string,
    maxResults: number,
    nextToken?: string,
    filter?: string,
  ): { Users: UserType[]; NextToken: string | undefined } {
    const allStored = this.store.list().filter((s) => s.userPoolId === userPoolId)
    let users = allStored.map((s) => s.user)

    // Simple filter support: "status = \"CONFIRMED\""  or  "email ^= \"test\""
    if (isString(filter) && filter.length > 0) {
      users = applyFilter(users, filter)
    }

    const startIndex = nextToken ? parseInt(nextToken, 10) : 0
    const endIndex = startIndex + maxResults
    const page = users.slice(startIndex, endIndex)
    const newNextToken = endIndex < users.length ? String(endIndex) : undefined

    return { Users: page, NextToken: newNextToken }
  }

  clear(): void {
    this.store.clear()
  }
}

// ── Seed auth events for new users ──────────────────────────────────

function createSeedAuthEvents(): AuthEventType[] {
  const now = Date.now()
  return [
    {
      EventId: crypto.randomUUID(),
      EventType: 'SignIn',
      CreationDate: new Date(now - 3_600_000),
      EventResponse: 'Pass',
      EventRisk: { RiskDecision: 'NoRisk', RiskLevel: 'Low', CompromisedCredentialsDetected: false },
      EventContextData: { IpAddress: '203.0.113.42', DeviceName: 'Chrome on Mac', City: 'Seattle', Country: 'US' },
    },
    {
      EventId: crypto.randomUUID(),
      EventType: 'SignIn',
      CreationDate: new Date(now - 86_400_000),
      EventResponse: 'Fail',
      EventRisk: { RiskDecision: 'AccountTakeover', RiskLevel: 'High', CompromisedCredentialsDetected: true },
      EventContextData: { IpAddress: '198.51.100.7', DeviceName: 'Firefox on Windows', City: 'New York', Country: 'US' },
    },
    {
      EventId: crypto.randomUUID(),
      EventType: 'ForgotPassword',
      CreationDate: new Date(now - 172_800_000),
      EventResponse: 'Pass',
      EventRisk: { RiskDecision: 'NoRisk', RiskLevel: 'Low', CompromisedCredentialsDetected: false },
      EventContextData: { IpAddress: '203.0.113.42', DeviceName: 'Safari on iPhone', City: 'Portland', Country: 'US' },
    },
  ]
}

// ── ListUsers filter parser ─────────────────────────────────────────

function applyFilter(users: UserType[], filter: string): UserType[] {
  // Cognito supports: attribute = "value", attribute ^= "prefix", status = "value"
  const match = /^(\w+)\s*(=|\^=)\s*"([^"]*)"$/.exec(filter.trim())
  if (!match) return users

  const [, field, operator, value] = match
  if (!isString(field) || !isString(operator) || !isString(value)) return users

  return users.filter((user) => {
    let actual: string | undefined

    if (field === 'status') {
      actual = user.UserStatus
    } else if (field === 'enabled') {
      actual = user.Enabled === true ? 'true' : 'false'
    } else if (field === 'username') {
      actual = user.Username
    } else {
      actual = findAttribute(user.Attributes ?? [], field)
    }

    if (actual === undefined) return false

    if (operator === '=') {
      return actual === value
    }
    if (operator === '^=') {
      return actual.startsWith(value)
    }
    return false
  })
}

export const userStore = new UserStore()
