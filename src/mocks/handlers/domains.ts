import type { OperationResolver } from './cognitoHandler'
import { domainStore } from '../stores/domainStore'
import { userPoolStore } from '../stores/userPoolStore'

function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key]
  return typeof val === 'string' ? val : undefined
}

const CreateUserPoolDomain: OperationResolver = (body) => {
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  const domain = domainStore.create(userPoolId, body)
  const isCustom = domain.CustomDomainConfig !== undefined

  // Sync domain name back to user pool (mirrors real Cognito behavior)
  try {
    userPoolStore.setDomain(userPoolId, domain.Domain ?? '', isCustom)
  } catch {
    // Pool may not exist in store during handler-only tests
  }

  return {
    ManagedLoginVersion: domain.ManagedLoginVersion,
    CloudFrontDomain: isCustom ? domain.CloudFrontDistribution : undefined,
  }
}

const DescribeUserPoolDomain: OperationResolver = (body) => {
  const domainName = getString(body, 'Domain') ?? ''
  const domain = domainStore.describe(domainName)
  return { DomainDescription: domain }
}

const UpdateUserPoolDomain: OperationResolver = (body) => {
  const domainName = getString(body, 'Domain') ?? ''
  const domain = domainStore.update(domainName, body)
  const isCustom = domain.CustomDomainConfig !== undefined
  return {
    ManagedLoginVersion: domain.ManagedLoginVersion,
    CloudFrontDomain: isCustom ? domain.CloudFrontDistribution : undefined,
  }
}

const DeleteUserPoolDomain: OperationResolver = (body) => {
  const domainName = getString(body, 'Domain') ?? ''
  const userPoolId = getString(body, 'UserPoolId') ?? ''
  domainStore.delete(domainName, userPoolId)

  // Clear domain from user pool
  try {
    userPoolStore.clearDomain(userPoolId)
  } catch {
    // Pool may not exist in store during handler-only tests
  }

  return {}
}

export const domainOperations: Record<string, OperationResolver> = {
  CreateUserPoolDomain,
  DescribeUserPoolDomain,
  UpdateUserPoolDomain,
  DeleteUserPoolDomain,
}
