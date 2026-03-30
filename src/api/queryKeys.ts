/**
 * Centralized query key factory for TanStack Query.
 * All keys follow the pattern: ['cognito', domain, operation, ...params]
 */

export function queryKey(
  domain: string,
  operation: string,
  ...params: readonly string[]
): readonly string[] {
  return ['cognito', domain, operation, ...params]
}

function createDomainKeys(domain: string) {
  return {
    all: ['cognito', domain],
    list: (...params: readonly string[]) => queryKey(domain, 'list', ...params),
    detail: (...params: readonly string[]) => queryKey(domain, 'detail', ...params),
  }
}

export const queryKeys = {
  all: ['cognito'],
  userPools: createDomainKeys('userPools'),
  users: createDomainKeys('users'),
  groups: createDomainKeys('groups'),
  appClients: createDomainKeys('appClients'),
  identityProviders: createDomainKeys('identityProviders'),
  domains: createDomainKeys('domains'),
  resourceServers: createDomainKeys('resourceServers'),
  userImport: createDomainKeys('userImport'),
  security: createDomainKeys('security'),
  branding: createDomainKeys('branding'),
  devices: createDomainKeys('devices'),
  webauthn: createDomainKeys('webauthn'),
  mfa: createDomainKeys('mfa'),
  tags: createDomainKeys('tags'),
  terms: createDomainKeys('terms'),
}
