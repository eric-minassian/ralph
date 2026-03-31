import type { OperationResolver } from './cognitoHandler'
import { userStore } from '../stores/userStore'

const DEFAULT_MAX_RESULTS = 20

function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key]
  return typeof val === 'string' ? val : undefined
}

function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const val = obj[key]
  return typeof val === 'number' ? val : undefined
}

function getBool(obj: Record<string, unknown>, key: string): boolean | undefined {
  const val = obj[key]
  return typeof val === 'boolean' ? val : undefined
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v): v is string => typeof v === 'string')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((v): v is Record<string, unknown> => isRecord(v))
}

function parseAttributeTypes(value: unknown): { Name: string; Value?: string }[] {
  if (!isRecordArray(value)) return []
  return value
    .filter((a): a is Record<string, unknown> & { Name: string } => typeof a.Name === 'string')
    .map((a) => {
      const base: { Name: string; Value?: string } = { Name: a.Name }
      if (typeof a.Value === 'string') {
        base.Value = a.Value
      }
      return base
    })
}

// ── Operations ──────────────────────────────────────────────────────

const ListUsers: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const maxResults = getNumber(body, 'Limit') ?? DEFAULT_MAX_RESULTS
  const nextToken = getString(body, 'PaginationToken')
  const filter = getString(body, 'Filter')
  const result = userStore.listUsers(userPoolId, maxResults, nextToken, filter)
  return { Users: result.Users, PaginationToken: result.NextToken }
}

const AdminCreateUser: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const user = userStore.create(userPoolId, body)
  return { User: user }
}

const AdminGetUser: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  const user = userStore.getUser(userPoolId, username)
  return {
    Username: user.Username,
    UserAttributes: user.Attributes,
    UserCreateDate: user.UserCreateDate,
    UserLastModifiedDate: user.UserLastModifiedDate,
    Enabled: user.Enabled,
    UserStatus: user.UserStatus,
    MFAOptions: user.MFAOptions,
  }
}

const AdminDeleteUser: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  userStore.deleteUser(userPoolId, username)
  return {}
}

const AdminEnableUser: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  userStore.enableUser(userPoolId, username)
  return {}
}

const AdminDisableUser: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  userStore.disableUser(userPoolId, username)
  return {}
}

const AdminConfirmSignUp: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  userStore.confirmSignUp(userPoolId, username)
  return {}
}

const AdminResetUserPassword: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  userStore.resetPassword(userPoolId, username)
  return {}
}

const AdminSetUserPassword: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  const password = getString(body, 'Password') ?? ''
  const permanent = getBool(body, 'Permanent') ?? false
  userStore.setPassword(userPoolId, username, password, permanent)
  return {}
}

const AdminUpdateUserAttributes: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  const attributes = parseAttributeTypes(body.UserAttributes)
  userStore.updateAttributes(userPoolId, username, attributes)
  return {}
}

const AdminDeleteUserAttributes: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  const attributeNames = isStringArray(body.UserAttributeNames) ? body.UserAttributeNames : []
  userStore.deleteAttributes(userPoolId, username, attributeNames)
  return {}
}

const AdminUserGlobalSignOut: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  userStore.globalSignOut(userPoolId, username)
  return {}
}

const AdminSetUserMFAPreference: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  userStore.setMfaPreference(
    userPoolId,
    username,
    body.SMSMfaSettings,
    body.SoftwareTokenMfaSettings,
  )
  return {}
}

const AdminAddUserToGroup: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  const groupName = getString(body, 'GroupName') ?? ''
  userStore.addToGroup(userPoolId, username, groupName)
  return {}
}

const AdminRemoveUserFromGroup: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  const groupName = getString(body, 'GroupName') ?? ''
  userStore.removeFromGroup(userPoolId, username, groupName)
  return {}
}

const AdminListGroupsForUser: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  const groups = userStore.listGroupsForUser(userPoolId, username)
  return { Groups: groups }
}

const AdminListUserAuthEvents: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  const maxResults = getNumber(body, 'MaxResults') ?? 10
  const nextToken = getString(body, 'NextToken')
  return userStore.listAuthEvents(userPoolId, username, maxResults, nextToken)
}

const AdminUpdateAuthEventFeedback: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const username = getString(body, 'Username') ?? ''
  const eventId = getString(body, 'EventId') ?? ''
  const feedbackValue = getString(body, 'FeedbackValue') ?? ''
  userStore.updateAuthEventFeedback(userPoolId, username, eventId, feedbackValue)
  return {}
}

export const userOperations: Record<string, OperationResolver> = {
  ListUsers,
  AdminCreateUser,
  AdminGetUser,
  AdminDeleteUser,
  AdminEnableUser,
  AdminDisableUser,
  AdminConfirmSignUp,
  AdminResetUserPassword,
  AdminSetUserPassword,
  AdminUpdateUserAttributes,
  AdminDeleteUserAttributes,
  AdminUserGlobalSignOut,
  AdminSetUserMFAPreference,
  AdminAddUserToGroup,
  AdminRemoveUserFromGroup,
  AdminListGroupsForUser,
  AdminListUserAuthEvents,
  AdminUpdateAuthEventFeedback,
}
