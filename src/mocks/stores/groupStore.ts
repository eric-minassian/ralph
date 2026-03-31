import type { GroupType, UserType } from '@aws-sdk/client-cognito-identity-provider'
import { BaseStore, StoreError } from './baseStore'
import { userStore } from './userStore'

// ── Type guard helpers ───────────────────────────────────────────────

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

// ── Store helpers ────────────────────────────────────────────────────

function compositeKey(userPoolId: string, groupName: string): string {
  return `${userPoolId}#${groupName}`
}

function getGroupKey(group: GroupType): string {
  return compositeKey(group.UserPoolId ?? '', group.GroupName ?? '')
}

// ── Main store ──────────────────────────────────────────────────────

class GroupStore {
  private readonly store = new BaseStore<GroupType>(getGroupKey)
  private readonly members = new Map<string, Set<string>>()

  create(userPoolId: string, input: Record<string, unknown>): GroupType {
    const groupName = input.GroupName
    if (!isString(groupName)) {
      throw new StoreError('InvalidParameterException', 'GroupName is required')
    }

    const now = new Date()
    const group: GroupType = {
      GroupName: groupName,
      UserPoolId: userPoolId,
      CreationDate: now,
      LastModifiedDate: now,
    }

    if (isString(input.Description)) {
      group.Description = input.Description
    }
    if (isNumber(input.Precedence)) {
      group.Precedence = input.Precedence
    }
    if (isString(input.RoleArn)) {
      group.RoleArn = input.RoleArn
    }

    this.store.create(group)
    this.members.set(compositeKey(userPoolId, groupName), new Set())
    return group
  }

  describe(userPoolId: string, groupName: string): GroupType {
    return this.store.get(compositeKey(userPoolId, groupName))
  }

  update(userPoolId: string, input: Record<string, unknown>): GroupType {
    const groupName = input.GroupName
    if (!isString(groupName)) {
      throw new StoreError('InvalidParameterException', 'GroupName is required')
    }
    const key = compositeKey(userPoolId, groupName)
    return this.store.update(key, (existing) => {
      const updated: GroupType = { ...existing, LastModifiedDate: new Date() }
      if (isString(input.Description)) {
        updated.Description = input.Description
      }
      if (isNumber(input.Precedence)) {
        updated.Precedence = input.Precedence
      }
      if (isString(input.RoleArn)) {
        updated.RoleArn = input.RoleArn
      }
      return updated
    })
  }

  delete(userPoolId: string, groupName: string): void {
    const key = compositeKey(userPoolId, groupName)
    this.store.delete(key)
    this.members.delete(key)
  }

  list(
    userPoolId: string,
    maxResults: number,
    nextToken?: string,
  ): { Groups: GroupType[]; NextToken: string | undefined } {
    const allGroups = this.store
      .list()
      .filter((g) => g.UserPoolId === userPoolId)
    const startIndex = nextToken ? parseInt(nextToken, 10) : 0
    const endIndex = startIndex + maxResults
    const pageItems = allGroups.slice(startIndex, endIndex)
    const newNextToken =
      endIndex < allGroups.length ? String(endIndex) : undefined
    return { Groups: pageItems, NextToken: newNextToken }
  }

  addUser(userPoolId: string, groupName: string, username: string): void {
    const key = compositeKey(userPoolId, groupName)
    // Verify group exists
    this.store.get(key)
    const memberSet = this.members.get(key)
    if (!memberSet) {
      throw new StoreError(
        'ResourceNotFoundException',
        `Group '${groupName}' not found`,
      )
    }
    memberSet.add(username)
  }

  removeUser(userPoolId: string, groupName: string, username: string): void {
    const key = compositeKey(userPoolId, groupName)
    this.store.get(key)
    const memberSet = this.members.get(key)
    if (memberSet) {
      memberSet.delete(username)
    }
  }

  listUsersInGroup(
    userPoolId: string,
    groupName: string,
    maxResults: number,
    nextToken?: string,
  ): { Users: UserType[]; NextToken: string | undefined } {
    const key = compositeKey(userPoolId, groupName)
    this.store.get(key)
    const memberSet = this.members.get(key) ?? new Set<string>()
    const usernames = [...memberSet]
    const startIndex = nextToken ? parseInt(nextToken, 10) : 0
    const endIndex = startIndex + maxResults
    const pageUsernames = usernames.slice(startIndex, endIndex)
    const newNextToken =
      endIndex < usernames.length ? String(endIndex) : undefined

    const users: UserType[] = pageUsernames
      .map((username) => {
        try {
          return userStore.getUser(userPoolId, username)
        } catch {
          return undefined
        }
      })
      .filter((u): u is UserType => u !== undefined)

    return { Users: users, NextToken: newNextToken }
  }

  clear(): void {
    this.store.clear()
    this.members.clear()
  }

  seed(userPoolId: string): void {
    this.create(userPoolId, {
      GroupName: 'Admins',
      Description: 'Administrator group with full access',
      Precedence: 1,
      RoleArn: 'arn:aws:iam::123456789012:role/CognitoAdminRole',
    })
    this.create(userPoolId, {
      GroupName: 'Editors',
      Description: 'Editor group with content management access',
      Precedence: 10,
    })
    this.create(userPoolId, {
      GroupName: 'Viewers',
      Description: 'Read-only access group',
      Precedence: 100,
    })
  }
}

export const groupStore = new GroupStore()
