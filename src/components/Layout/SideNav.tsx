import { useMemo } from 'react'
import SideNavigation, {
  type SideNavigationProps,
} from '@cloudscape-design/components/side-navigation'
import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { usePermissions } from '../../hooks/usePermissions'
import {
  navigationConfig,
  type NavLinkConfig,
} from '../../config/navigation'

function isLinkVisible(
  item: NavLinkConfig,
  hasAnyPermission: (ps: readonly string[]) => boolean,
): boolean {
  return item.permissions.length === 0 || hasAnyPermission(item.permissions)
}

export function SideNav() {
  const { t } = useTranslation('navigation')
  const { hasAnyPermission } = usePermissions()
  const router = useRouter()
  const currentPath = router.state.location.pathname

  const items = useMemo<SideNavigationProps.Item[]>(() => {
    const result: SideNavigationProps.Item[] = []

    for (const entry of navigationConfig) {
      if (entry.type === 'divider') {
        result.push({ type: 'divider' })
        continue
      }

      if (entry.type === 'link') {
        if (isLinkVisible(entry, hasAnyPermission)) {
          result.push({
            type: 'link',
            text: t(entry.textKey),
            href: entry.href,
          })
        }
        continue
      }

      const visibleItems = filterSectionItems(entry.items, hasAnyPermission, t)
      if (visibleItems.length > 0) {
        result.push({
          type: 'section',
          text: t(entry.textKey),
          items: visibleItems,
        })
      }
    }

    return result
  }, [t, hasAnyPermission])

  return (
    <SideNavigation
      activeHref={currentPath}
      items={items}
      onFollow={(event) => {
        if (!event.detail.external) {
          event.preventDefault()
          void router.navigate({ to: event.detail.href })
        }
      }}
    />
  )
}

function filterSectionItems(
  items: readonly NavLinkConfig[],
  hasAnyPermission: (ps: readonly string[]) => boolean,
  t: (key: string) => string,
): SideNavigationProps.Item[] {
  return items
    .filter((item) => isLinkVisible(item, hasAnyPermission))
    .map(
      (item): SideNavigationProps.Item => ({
        type: 'link',
        text: t(item.textKey),
        href: item.href,
      }),
    )
}
