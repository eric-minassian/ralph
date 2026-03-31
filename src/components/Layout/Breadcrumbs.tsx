import { useMemo } from 'react'
import BreadcrumbGroup, {
  type BreadcrumbGroupProps,
} from '@cloudscape-design/components/breadcrumb-group'
import { useRouter, useMatches } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

const routeLabelKeys: Record<string, string> = {
  __root__: 'breadcrumbs.home',
  '/': 'breadcrumbs.home',
  '/not-authorized': 'breadcrumbs.notAuthorized',
  '/user-pools': 'breadcrumbs.userPools',
  '/user-pools/create': 'breadcrumbs.createUserPool',
  '/user-pools/$userPoolId': 'breadcrumbs.poolDetail',
  '/user-pools/$userPoolId/users': 'breadcrumbs.users',
  '/user-pools/$userPoolId/users/create': 'breadcrumbs.createUser',
  '/user-pools/$userPoolId/users/$username': 'breadcrumbs.userDetail',
  '/user-pools/$userPoolId/groups': 'breadcrumbs.groups',
  '/user-pools/$userPoolId/groups/create': 'breadcrumbs.createGroup',
  '/user-pools/$userPoolId/groups/$groupName': 'breadcrumbs.groupDetail',
  '/user-pools/$userPoolId/app-clients': 'breadcrumbs.appClients',
  '/user-pools/$userPoolId/identity-providers': 'breadcrumbs.identityProviders',
  '/user-pools/$userPoolId/domain': 'breadcrumbs.domains',
  '/user-pools/$userPoolId/resource-servers': 'breadcrumbs.resourceServers',
  '/user-pools/$userPoolId/branding': 'breadcrumbs.branding',
  '/user-pools/$userPoolId/security': 'breadcrumbs.security',
  '/user-pools/$userPoolId/terms': 'breadcrumbs.termsOfService',
  '/user-pools/$userPoolId/import': 'breadcrumbs.import',
}

export function Breadcrumbs() {
  const { t } = useTranslation('navigation')
  const matches = useMatches()
  const router = useRouter()

  const items = useMemo<BreadcrumbGroupProps.Item[]>(() => {
    const breadcrumbs: BreadcrumbGroupProps.Item[] = []

    for (const match of matches) {
      const routeId = match.routeId
      const labelKey = routeLabelKeys[routeId]

      if (routeId === '__root__') {
        breadcrumbs.push({
          text: t('breadcrumbs.home'),
          href: '/',
        })
        continue
      }

      if (labelKey !== undefined) {
        breadcrumbs.push({
          text: t(labelKey),
          href: match.pathname,
        })
      }
    }

    return breadcrumbs
  }, [matches, t])

  return (
    <BreadcrumbGroup
      items={items}
      onFollow={(event) => {
        event.preventDefault()
        void router.navigate({ to: event.detail.href })
      }}
    />
  )
}
