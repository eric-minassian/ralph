import type { ResourceServerType, ResourceServerScopeType } from '@aws-sdk/client-cognito-identity-provider'
import { BaseStore, StoreError } from './baseStore'

// ── Type guard helpers ───────────────────────────────────────────────

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

// ── Store helpers ────────────────────────────────────────────────────

function compositeKey(userPoolId: string, identifier: string): string {
  return `${userPoolId}#${identifier}`
}

function getResourceServerKey(rs: ResourceServerType): string {
  return compositeKey(rs.UserPoolId ?? '', rs.Identifier ?? '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseScopeItem(item: unknown): ResourceServerScopeType | undefined {
  if (!isRecord(item)) return undefined
  const scopeName = item.ScopeName
  const scopeDescription = item.ScopeDescription
  if (!isString(scopeName)) return undefined
  return {
    ScopeName: scopeName,
    ScopeDescription: isString(scopeDescription) ? scopeDescription : undefined,
  }
}

function parseScopes(input: unknown): ResourceServerScopeType[] {
  if (!isArray(input)) return []
  const scopes: ResourceServerScopeType[] = []
  for (const item of input) {
    const scope = parseScopeItem(item)
    if (scope) {
      scopes.push(scope)
    }
  }
  return scopes
}

// ── Main store ──────────────────────────────────────────────────────

class ResourceServerStore {
  private readonly store = new BaseStore<ResourceServerType>(getResourceServerKey)

  create(userPoolId: string, input: Record<string, unknown>): ResourceServerType {
    const identifier = input.Identifier
    if (!isString(identifier)) {
      throw new StoreError('InvalidParameterException', 'Identifier is required')
    }
    const name = input.Name
    if (!isString(name)) {
      throw new StoreError('InvalidParameterException', 'Name is required')
    }

    const scopes = parseScopes(input.Scopes)

    const resourceServer: ResourceServerType = {
      UserPoolId: userPoolId,
      Identifier: identifier,
      Name: name,
      Scopes: scopes,
    }

    this.store.create(resourceServer)
    return resourceServer
  }

  describe(userPoolId: string, identifier: string): ResourceServerType {
    return this.store.get(compositeKey(userPoolId, identifier))
  }

  update(userPoolId: string, input: Record<string, unknown>): ResourceServerType {
    const identifier = input.Identifier
    if (!isString(identifier)) {
      throw new StoreError('InvalidParameterException', 'Identifier is required')
    }
    const key = compositeKey(userPoolId, identifier)
    return this.store.update(key, (existing) => {
      const updated: ResourceServerType = { ...existing }
      if (isString(input.Name)) {
        updated.Name = input.Name
      }
      if (isArray(input.Scopes)) {
        updated.Scopes = parseScopes(input.Scopes)
      }
      return updated
    })
  }

  delete(userPoolId: string, identifier: string): void {
    const key = compositeKey(userPoolId, identifier)
    this.store.delete(key)
  }

  list(
    userPoolId: string,
    maxResults: number,
    nextToken?: string,
  ): { ResourceServers: ResourceServerType[]; NextToken: string | undefined } {
    const allServers = this.store
      .list()
      .filter((rs) => rs.UserPoolId === userPoolId)
    const startIndex = nextToken ? parseInt(nextToken, 10) : 0
    const endIndex = startIndex + maxResults
    const pageItems = allServers.slice(startIndex, endIndex)
    const newNextToken =
      endIndex < allServers.length ? String(endIndex) : undefined
    return { ResourceServers: pageItems, NextToken: newNextToken }
  }

  clear(): void {
    this.store.clear()
  }

  seed(userPoolId: string): void {
    this.create(userPoolId, {
      Identifier: 'https://api.example.com',
      Name: 'Example API',
      Scopes: [
        { ScopeName: 'read', ScopeDescription: 'Read access to the API' },
        { ScopeName: 'write', ScopeDescription: 'Write access to the API' },
        { ScopeName: 'admin', ScopeDescription: 'Full administrative access' },
      ],
    })
    this.create(userPoolId, {
      Identifier: 'https://orders.example.com',
      Name: 'Orders Service',
      Scopes: [
        { ScopeName: 'orders:read', ScopeDescription: 'Read order data' },
        { ScopeName: 'orders:write', ScopeDescription: 'Create and update orders' },
      ],
    })
  }
}

export const resourceServerStore = new ResourceServerStore()
