import { describe, it, expect, beforeEach } from 'vitest'
import {
  CreateUserPoolDomainCommand,
  DescribeUserPoolDomainCommand,
  UpdateUserPoolDomainCommand,
  DeleteUserPoolDomainCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../../api/client'
import { domainStore } from '../stores/domainStore'

const POOL_ID = 'us-east-1_HandlerTest'

describe('Domain MSW Handlers', () => {
  beforeEach(() => {
    domainStore.clear()
  })

  it('CreateUserPoolDomain creates a prefix domain', async () => {
    const result = await cognitoClient.send(
      new CreateUserPoolDomainCommand({
        Domain: 'my-prefix',
        UserPoolId: POOL_ID,
      }),
    )
    expect(result.$metadata.httpStatusCode).toBe(200)
  })

  it('CreateUserPoolDomain creates a custom domain with CloudFront', async () => {
    const result = await cognitoClient.send(
      new CreateUserPoolDomainCommand({
        Domain: 'auth.example.com',
        UserPoolId: POOL_ID,
        CustomDomainConfig: {
          CertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/abc',
        },
      }),
    )
    expect(result.CloudFrontDomain).toBeDefined()
  })

  it('DescribeUserPoolDomain returns domain info', async () => {
    domainStore.create(POOL_ID, { Domain: 'describe-test', UserPoolId: POOL_ID })
    const result = await cognitoClient.send(
      new DescribeUserPoolDomainCommand({ Domain: 'describe-test' }),
    )
    expect(result.DomainDescription?.Domain).toBe('describe-test')
    expect(result.DomainDescription?.UserPoolId).toBe(POOL_ID)
    expect(result.DomainDescription?.Status).toBe('ACTIVE')
  })

  it('DescribeUserPoolDomain returns empty for missing domain', async () => {
    const result = await cognitoClient.send(
      new DescribeUserPoolDomainCommand({ Domain: 'nonexistent' }),
    )
    expect(result.DomainDescription?.Domain).toBeUndefined()
  })

  it('UpdateUserPoolDomain updates certificate', async () => {
    domainStore.create(POOL_ID, {
      Domain: 'auth.example.com',
      UserPoolId: POOL_ID,
      CustomDomainConfig: {
        CertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/old',
      },
    })
    const result = await cognitoClient.send(
      new UpdateUserPoolDomainCommand({
        Domain: 'auth.example.com',
        UserPoolId: POOL_ID,
        CustomDomainConfig: {
          CertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/new',
        },
      }),
    )
    expect(result.CloudFrontDomain).toBeDefined()

    const describe = await cognitoClient.send(
      new DescribeUserPoolDomainCommand({ Domain: 'auth.example.com' }),
    )
    expect(describe.DomainDescription?.CustomDomainConfig?.CertificateArn).toBe(
      'arn:aws:acm:us-east-1:123456789012:certificate/new',
    )
  })

  it('DeleteUserPoolDomain removes domain', async () => {
    domainStore.create(POOL_ID, { Domain: 'to-delete', UserPoolId: POOL_ID })
    await cognitoClient.send(
      new DeleteUserPoolDomainCommand({ Domain: 'to-delete', UserPoolId: POOL_ID }),
    )
    const result = await cognitoClient.send(
      new DescribeUserPoolDomainCommand({ Domain: 'to-delete' }),
    )
    expect(result.DomainDescription?.Domain).toBeUndefined()
  })

  it('DeleteUserPoolDomain rejects missing domain', async () => {
    await expect(
      cognitoClient.send(
        new DeleteUserPoolDomainCommand({ Domain: 'missing', UserPoolId: POOL_ID }),
      ),
    ).rejects.toThrow()
  })

  it('CreateUserPoolDomain rejects duplicate for same pool', async () => {
    await cognitoClient.send(
      new CreateUserPoolDomainCommand({ Domain: 'first', UserPoolId: POOL_ID }),
    )
    await expect(
      cognitoClient.send(
        new CreateUserPoolDomainCommand({ Domain: 'second', UserPoolId: POOL_ID }),
      ),
    ).rejects.toThrow()
  })
})
