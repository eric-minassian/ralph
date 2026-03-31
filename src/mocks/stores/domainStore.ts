import type {
  DomainDescriptionType,
  DomainStatusType,
} from '@aws-sdk/client-cognito-identity-provider'
import { BaseStore, StoreError } from './baseStore'

// ── Type guard helpers ───────────────────────────────────────────────

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// ── Store helpers ────────────────────────────────────────────────────

/**
 * Domain is keyed by the domain string itself (unique across all pools).
 * DescribeUserPoolDomain takes only Domain, not UserPoolId.
 */
function getDomainKey(domain: DomainDescriptionType): string {
  return domain.Domain ?? ''
}

// ── Main store ──────────────────────────────────────────────────────

class DomainStore {
  private readonly store = new BaseStore<DomainDescriptionType>(getDomainKey)

  create(userPoolId: string, input: Record<string, unknown>): DomainDescriptionType {
    const domain = input.Domain
    if (!isString(domain) || domain.trim().length === 0) {
      throw new StoreError('InvalidParameterException', 'Domain is required')
    }

    // Check if this user pool already has a domain
    const existing = this.store.list().find((d) => d.UserPoolId === userPoolId)
    if (existing) {
      throw new StoreError(
        'InvalidParameterException',
        'A domain is already associated with this user pool',
      )
    }

    const now = new Date()
    const isCustomDomain = isRecord(input.CustomDomainConfig)
    const status: DomainStatusType = isCustomDomain ? 'CREATING' : 'ACTIVE'

    const domainDesc: DomainDescriptionType = {
      Domain: domain.trim(),
      UserPoolId: userPoolId,
      AWSAccountId: '123456789012',
      Status: status,
      Version: '1',
    }

    if (isCustomDomain) {
      const certArn = input.CustomDomainConfig
      if (isRecord(certArn)) {
        const arn = certArn.CertificateArn
        if (isString(arn)) {
          domainDesc.CustomDomainConfig = { CertificateArn: arn }
          domainDesc.CloudFrontDistribution = `d1234567890.cloudfront.net`
        }
      }
    }

    if (isNumber(input.ManagedLoginVersion)) {
      domainDesc.ManagedLoginVersion = input.ManagedLoginVersion
    }

    // Store creation/modification date in S3Bucket field area (SDK doesn't have explicit date fields on DomainDescriptionType)
    // We'll track them internally for seed data
    void now

    this.store.create(domainDesc)
    return domainDesc
  }

  describe(domain: string): DomainDescriptionType {
    // DescribeUserPoolDomain returns an empty DomainDescription if not found
    // (it doesn't throw, unlike other Cognito APIs)
    if (!this.store.has(domain)) {
      return {}
    }
    return this.store.get(domain)
  }

  update(domain: string, input: Record<string, unknown>): DomainDescriptionType {
    if (!this.store.has(domain)) {
      throw new StoreError('ResourceNotFoundException', `Domain '${domain}' not found`)
    }
    return this.store.update(domain, (existing) => {
      const updated: DomainDescriptionType = { ...existing, Status: 'UPDATING' }

      if (isRecord(input.CustomDomainConfig)) {
        const arn = input.CustomDomainConfig.CertificateArn
        if (isString(arn)) {
          updated.CustomDomainConfig = { CertificateArn: arn }
        }
      }

      if (isNumber(input.ManagedLoginVersion)) {
        updated.ManagedLoginVersion = input.ManagedLoginVersion
      }

      // Simulate async: set to ACTIVE after update
      updated.Status = 'ACTIVE'

      return updated
    })
  }

  delete(domain: string, userPoolId: string): void {
    if (!this.store.has(domain)) {
      throw new StoreError('ResourceNotFoundException', `Domain '${domain}' not found`)
    }
    const existing = this.store.get(domain)
    if (existing.UserPoolId !== userPoolId) {
      throw new StoreError('InvalidParameterException', 'Domain does not belong to this user pool')
    }
    this.store.delete(domain)
  }

  describeByUserPool(userPoolId: string): DomainDescriptionType | undefined {
    return this.store.list().find((d) => d.UserPoolId === userPoolId)
  }

  clear(): void {
    this.store.clear()
  }

  seed(userPoolId: string): void {
    this.create(userPoolId, {
      Domain: 'my-app-auth',
      UserPoolId: userPoolId,
    })
  }
}

export const domainStore = new DomainStore()
