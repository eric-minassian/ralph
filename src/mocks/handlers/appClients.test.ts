import { describe, it, expect, beforeEach } from 'vitest'
import {
  CreateUserPoolClientCommand,
  DescribeUserPoolClientCommand,
  UpdateUserPoolClientCommand,
  DeleteUserPoolClientCommand,
  ListUserPoolClientsCommand,
  AddUserPoolClientSecretCommand,
  DeleteUserPoolClientSecretCommand,
  ListUserPoolClientSecretsCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../../api/client'
import { appClientStore } from '../stores/appClientStore'

const POOL_ID = 'us-east-1_HandlerTest'

describe('AppClient MSW Handlers', () => {
  beforeEach(() => {
    appClientStore.clear()
  })

  it('CreateUserPoolClient creates a new client', async () => {
    const result = await cognitoClient.send(
      new CreateUserPoolClientCommand({
        UserPoolId: POOL_ID,
        ClientName: 'TestApp',
        ExplicitAuthFlows: ['ALLOW_USER_SRP_AUTH'],
      }),
    )
    expect(result.UserPoolClient?.ClientName).toBe('TestApp')
    expect(result.UserPoolClient?.ClientId).toBeDefined()
    expect(result.UserPoolClient?.ExplicitAuthFlows).toEqual(['ALLOW_USER_SRP_AUTH'])
  })

  it('DescribeUserPoolClient retrieves a client', async () => {
    const created = appClientStore.create(POOL_ID, { ClientName: 'Fetch' })
    const result = await cognitoClient.send(
      new DescribeUserPoolClientCommand({
        UserPoolId: POOL_ID,
        ClientId: created.ClientId ?? '',
      }),
    )
    expect(result.UserPoolClient?.ClientName).toBe('Fetch')
  })

  it('UpdateUserPoolClient updates fields', async () => {
    const created = appClientStore.create(POOL_ID, { ClientName: 'Upd' })
    const result = await cognitoClient.send(
      new UpdateUserPoolClientCommand({
        UserPoolId: POOL_ID,
        ClientId: created.ClientId ?? '',
        ClientName: 'Updated',
        ExplicitAuthFlows: ['ALLOW_CUSTOM_AUTH'],
      }),
    )
    expect(result.UserPoolClient?.ClientName).toBe('Updated')
    expect(result.UserPoolClient?.ExplicitAuthFlows).toEqual(['ALLOW_CUSTOM_AUTH'])
  })

  it('DeleteUserPoolClient removes a client', async () => {
    const created = appClientStore.create(POOL_ID, { ClientName: 'ToDelete' })
    await cognitoClient.send(
      new DeleteUserPoolClientCommand({
        UserPoolId: POOL_ID,
        ClientId: created.ClientId ?? '',
      }),
    )
    await expect(
      cognitoClient.send(
        new DescribeUserPoolClientCommand({
          UserPoolId: POOL_ID,
          ClientId: created.ClientId ?? '',
        }),
      ),
    ).rejects.toThrow()
  })

  it('ListUserPoolClients returns clients for pool', async () => {
    appClientStore.create(POOL_ID, { ClientName: 'C1' })
    appClientStore.create(POOL_ID, { ClientName: 'C2' })
    appClientStore.create(POOL_ID, { ClientName: 'C3' })
    const result = await cognitoClient.send(
      new ListUserPoolClientsCommand({ UserPoolId: POOL_ID, MaxResults: 60 }),
    )
    expect(result.UserPoolClients).toHaveLength(3)
  })

  it('ListUserPoolClients paginates', async () => {
    for (let i = 0; i < 5; i++) {
      appClientStore.create(POOL_ID, { ClientName: `Pg${String(i)}` })
    }
    const page1 = await cognitoClient.send(
      new ListUserPoolClientsCommand({ UserPoolId: POOL_ID, MaxResults: 2 }),
    )
    expect(page1.UserPoolClients).toHaveLength(2)
    expect(page1.NextToken).toBeDefined()

    const page2 = await cognitoClient.send(
      new ListUserPoolClientsCommand({ UserPoolId: POOL_ID, MaxResults: 2, NextToken: page1.NextToken }),
    )
    expect(page2.UserPoolClients).toHaveLength(2)
  })

  it('AddUserPoolClientSecret creates a secret', async () => {
    const created = appClientStore.create(POOL_ID, { ClientName: 'SecretApp' })
    const result = await cognitoClient.send(
      new AddUserPoolClientSecretCommand({
        UserPoolId: POOL_ID,
        ClientId: created.ClientId ?? '',
      }),
    )
    expect(result.ClientSecretDescriptor?.ClientSecretId).toBeDefined()
    expect(result.ClientSecretDescriptor?.ClientSecretValue).toBeDefined()
  })

  it('ListUserPoolClientSecrets lists secrets', async () => {
    const created = appClientStore.create(POOL_ID, { ClientName: 'ListSecret' })
    const clientId = created.ClientId ?? ''
    appClientStore.addSecret(POOL_ID, clientId)
    appClientStore.addSecret(POOL_ID, clientId)
    const result = await cognitoClient.send(
      new ListUserPoolClientSecretsCommand({
        UserPoolId: POOL_ID,
        ClientId: clientId,
      }),
    )
    expect(result.ClientSecrets).toHaveLength(2)
  })

  it('DeleteUserPoolClientSecret deletes a secret', async () => {
    const created = appClientStore.create(POOL_ID, { ClientName: 'DelSecret' })
    const clientId = created.ClientId ?? ''
    const secret = appClientStore.addSecret(POOL_ID, clientId)
    await cognitoClient.send(
      new DeleteUserPoolClientSecretCommand({
        UserPoolId: POOL_ID,
        ClientId: clientId,
        ClientSecretId: secret.ClientSecretId,
      }),
    )
    const result = appClientStore.listSecrets(POOL_ID, clientId)
    expect(result.ClientSecrets).toHaveLength(0)
  })

  it('DescribeUserPoolClient rejects missing client', async () => {
    await expect(
      cognitoClient.send(
        new DescribeUserPoolClientCommand({
          UserPoolId: POOL_ID,
          ClientId: 'nonexistent',
        }),
      ),
    ).rejects.toThrow()
  })
})
