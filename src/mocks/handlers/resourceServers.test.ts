import { describe, it, expect, beforeEach } from 'vitest'
import {
  CreateResourceServerCommand,
  DescribeResourceServerCommand,
  UpdateResourceServerCommand,
  DeleteResourceServerCommand,
  ListResourceServersCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../../api/client'
import { resourceServerStore } from '../stores/resourceServerStore'

const POOL_ID = 'us-east-1_TestPool'

describe('Resource Server MSW handlers', () => {
  beforeEach(() => {
    resourceServerStore.clear()
  })

  it('creates a resource server', async () => {
    const result = await cognitoClient.send(
      new CreateResourceServerCommand({
        UserPoolId: POOL_ID,
        Identifier: 'https://api.test.com',
        Name: 'Test API',
        Scopes: [{ ScopeName: 'read', ScopeDescription: 'Read access' }],
      }),
    )
    expect(result.ResourceServer?.Identifier).toBe('https://api.test.com')
    expect(result.ResourceServer?.Name).toBe('Test API')
    expect(result.ResourceServer?.Scopes).toHaveLength(1)
  })

  it('describes a resource server', async () => {
    resourceServerStore.create(POOL_ID, {
      Identifier: 'https://api.test.com',
      Name: 'Test API',
    })
    const result = await cognitoClient.send(
      new DescribeResourceServerCommand({
        UserPoolId: POOL_ID,
        Identifier: 'https://api.test.com',
      }),
    )
    expect(result.ResourceServer?.Name).toBe('Test API')
  })

  it('updates a resource server', async () => {
    resourceServerStore.create(POOL_ID, {
      Identifier: 'https://api.test.com',
      Name: 'Old Name',
    })
    const result = await cognitoClient.send(
      new UpdateResourceServerCommand({
        UserPoolId: POOL_ID,
        Identifier: 'https://api.test.com',
        Name: 'New Name',
        Scopes: [{ ScopeName: 'admin', ScopeDescription: 'Admin access' }],
      }),
    )
    expect(result.ResourceServer?.Name).toBe('New Name')
    expect(result.ResourceServer?.Scopes).toHaveLength(1)
  })

  it('deletes a resource server', async () => {
    resourceServerStore.create(POOL_ID, {
      Identifier: 'https://api.test.com',
      Name: 'To Delete',
    })
    await cognitoClient.send(
      new DeleteResourceServerCommand({
        UserPoolId: POOL_ID,
        Identifier: 'https://api.test.com',
      }),
    )
    expect(() => resourceServerStore.describe(POOL_ID, 'https://api.test.com')).toThrow()
  })

  it('lists resource servers', async () => {
    resourceServerStore.create(POOL_ID, { Identifier: 'https://a.com', Name: 'A' })
    resourceServerStore.create(POOL_ID, { Identifier: 'https://b.com', Name: 'B' })

    const result = await cognitoClient.send(
      new ListResourceServersCommand({
        UserPoolId: POOL_ID,
        MaxResults: 10,
      }),
    )
    expect(result.ResourceServers).toHaveLength(2)
  })

  it('handles pagination', async () => {
    for (let i = 0; i < 5; i++) {
      resourceServerStore.create(POOL_ID, {
        Identifier: `https://${String(i)}.com`,
        Name: `Server ${String(i)}`,
      })
    }
    const page1 = await cognitoClient.send(
      new ListResourceServersCommand({
        UserPoolId: POOL_ID,
        MaxResults: 2,
      }),
    )
    expect(page1.ResourceServers).toHaveLength(2)
    expect(page1.NextToken).toBeDefined()

    const page2 = await cognitoClient.send(
      new ListResourceServersCommand({
        UserPoolId: POOL_ID,
        MaxResults: 2,
        NextToken: page1.NextToken,
      }),
    )
    expect(page2.ResourceServers).toHaveLength(2)
  })

  it('returns error for duplicate identifier', async () => {
    resourceServerStore.create(POOL_ID, {
      Identifier: 'https://dup.com',
      Name: 'First',
    })
    await expect(
      cognitoClient.send(
        new CreateResourceServerCommand({
          UserPoolId: POOL_ID,
          Identifier: 'https://dup.com',
          Name: 'Second',
        }),
      ),
    ).rejects.toThrow()
  })

  it('returns error for describe non-existent', async () => {
    await expect(
      cognitoClient.send(
        new DescribeResourceServerCommand({
          UserPoolId: POOL_ID,
          Identifier: 'https://missing.com',
        }),
      ),
    ).rejects.toThrow()
  })
})
