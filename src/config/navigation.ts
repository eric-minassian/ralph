import type { CognitoPermission } from '../types/permissions'

export interface NavLinkConfig {
  type: 'link'
  id: string
  textKey: string
  href: string
  permissions: readonly CognitoPermission[]
}

export interface NavSectionConfig {
  type: 'section'
  textKey: string
  items: readonly NavLinkConfig[]
}

export interface NavDividerConfig {
  type: 'divider'
}

export type NavEntryConfig =
  | NavLinkConfig
  | NavSectionConfig
  | NavDividerConfig

export const navigationConfig: readonly NavEntryConfig[] = [
  {
    type: 'link',
    id: 'user-pools',
    textKey: 'sidebar.userPools',
    href: '/user-pools',
    permissions: ['ListUserPools'],
  },
  {
    type: 'divider',
  },
  {
    type: 'section',
    textKey: 'sidebar.sections.poolResources',
    items: [
      {
        type: 'link',
        id: 'users',
        textKey: 'sidebar.users',
        href: '/user-pools',
        permissions: ['AdminGetUser', 'AdminCreateUser', 'ListUsers'],
      },
      {
        type: 'link',
        id: 'groups',
        textKey: 'sidebar.groups',
        href: '/user-pools',
        permissions: ['ListGroups', 'CreateGroup'],
      },
      {
        type: 'link',
        id: 'app-clients',
        textKey: 'sidebar.appClients',
        href: '/user-pools',
        permissions: ['ListUserPoolClients', 'CreateUserPoolClient'],
      },
      {
        type: 'link',
        id: 'identity-providers',
        textKey: 'sidebar.identityProviders',
        href: '/user-pools',
        permissions: ['ListIdentityProviders', 'CreateIdentityProvider'],
      },
    ],
  },
  {
    type: 'section',
    textKey: 'sidebar.sections.poolConfiguration',
    items: [
      {
        type: 'link',
        id: 'domains',
        textKey: 'sidebar.domains',
        href: '/user-pools',
        permissions: ['DescribeUserPoolDomain', 'CreateUserPoolDomain'],
      },
      {
        type: 'link',
        id: 'resource-servers',
        textKey: 'sidebar.resourceServers',
        href: '/user-pools',
        permissions: ['ListResourceServers', 'CreateResourceServer'],
      },
      {
        type: 'link',
        id: 'branding',
        textKey: 'sidebar.branding',
        href: '/user-pools',
        permissions: [
          'DescribeManagedLoginBranding',
          'CreateManagedLoginBranding',
        ],
      },
      {
        type: 'link',
        id: 'security',
        textKey: 'sidebar.security',
        href: '/user-pools',
        permissions: ['DescribeRiskConfiguration', 'SetRiskConfiguration'],
      },
      {
        type: 'link',
        id: 'terms',
        textKey: 'sidebar.termsOfService',
        href: '/user-pools',
        permissions: ['ListTerms', 'CreateTerms'],
      },
    ],
  },
]
