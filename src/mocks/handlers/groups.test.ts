import { describe, it, expect, beforeEach } from 'vitest'
import {
  CreateGroupCommand,
  GetGroupCommand,
  UpdateGroupCommand,
  DeleteGroupCommand,
  ListGroupsCommand,
  ListUsersInGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../../api/client'
import { groupStore } from '../stores/groupStore'
import { userStore } from '../stores/userStore'
import { userPoolStore } from '../stores/userPoolStore'

const POOL_ID = 'us-east-1_HandlerTest'

describe('Group MSW Handlers', () => {
  beforeEach(() => {
    groupStore.clear()
    userStore.clear()
    userPoolStore.clear()
  })

  it('CreateGroup creates a new group', async () => {
    const result = await cognitoClient.send(
      new CreateGroupCommand({
        UserPoolId: POOL_ID,
        GroupName: 'TestGroup',
        Description: 'A test group',
        Precedence: 5,
      }),
    )
    expect(result.Group?.GroupName).toBe('TestGroup')
    expect(result.Group?.Description).toBe('A test group')
    expect(result.Group?.Precedence).toBe(5)
  })

  it('GetGroup retrieves a group', async () => {
    groupStore.create(POOL_ID, { GroupName: 'Fetch', Description: 'fetch desc' })
    const result = await cognitoClient.send(
      new GetGroupCommand({ UserPoolId: POOL_ID, GroupName: 'Fetch' }),
    )
    expect(result.Group?.GroupName).toBe('Fetch')
    expect(result.Group?.Description).toBe('fetch desc')
  })

  it('UpdateGroup updates group fields', async () => {
    groupStore.create(POOL_ID, { GroupName: 'Upd', Description: 'old' })
    const result = await cognitoClient.send(
      new UpdateGroupCommand({
        UserPoolId: POOL_ID,
        GroupName: 'Upd',
        Description: 'new desc',
        Precedence: 99,
      }),
    )
    expect(result.Group?.Description).toBe('new desc')
    expect(result.Group?.Precedence).toBe(99)
  })

  it('DeleteGroup removes a group', async () => {
    groupStore.create(POOL_ID, { GroupName: 'ToDelete' })
    await cognitoClient.send(
      new DeleteGroupCommand({ UserPoolId: POOL_ID, GroupName: 'ToDelete' }),
    )
    await expect(
      cognitoClient.send(new GetGroupCommand({ UserPoolId: POOL_ID, GroupName: 'ToDelete' })),
    ).rejects.toThrow()
  })

  it('ListGroups returns groups for pool', async () => {
    groupStore.create(POOL_ID, { GroupName: 'G1' })
    groupStore.create(POOL_ID, { GroupName: 'G2' })
    groupStore.create(POOL_ID, { GroupName: 'G3' })
    const result = await cognitoClient.send(
      new ListGroupsCommand({ UserPoolId: POOL_ID, Limit: 60 }),
    )
    expect(result.Groups).toHaveLength(3)
  })

  it('ListGroups paginates', async () => {
    for (let i = 0; i < 5; i++) {
      groupStore.create(POOL_ID, { GroupName: `Pg${String(i)}` })
    }
    const page1 = await cognitoClient.send(
      new ListGroupsCommand({ UserPoolId: POOL_ID, Limit: 2 }),
    )
    expect(page1.Groups).toHaveLength(2)
    expect(page1.NextToken).toBeDefined()

    const page2 = await cognitoClient.send(
      new ListGroupsCommand({ UserPoolId: POOL_ID, Limit: 2, NextToken: page1.NextToken }),
    )
    expect(page2.Groups).toHaveLength(2)
  })

  it('ListUsersInGroup returns group members', async () => {
    groupStore.create(POOL_ID, { GroupName: 'Members' })
    userStore.create(POOL_ID, { Username: 'u1' })
    userStore.create(POOL_ID, { Username: 'u2' })
    groupStore.addUser(POOL_ID, 'Members', 'u1')
    groupStore.addUser(POOL_ID, 'Members', 'u2')

    const result = await cognitoClient.send(
      new ListUsersInGroupCommand({ UserPoolId: POOL_ID, GroupName: 'Members', Limit: 60 }),
    )
    expect(result.Users).toHaveLength(2)
  })

  it('CreateGroup rejects duplicate name', async () => {
    groupStore.create(POOL_ID, { GroupName: 'Dup' })
    await expect(
      cognitoClient.send(
        new CreateGroupCommand({ UserPoolId: POOL_ID, GroupName: 'Dup' }),
      ),
    ).rejects.toThrow()
  })

  it('GetGroup rejects missing group', async () => {
    await expect(
      cognitoClient.send(
        new GetGroupCommand({ UserPoolId: POOL_ID, GroupName: 'Missing' }),
      ),
    ).rejects.toThrow()
  })
})
