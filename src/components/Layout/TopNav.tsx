import TopNavigation from '@cloudscape-design/components/top-navigation'
import { useTranslation } from 'react-i18next'

export function TopNav() {
  const { t } = useTranslation('navigation')

  return (
    <TopNavigation
      identity={{
        href: '/',
        title: t('common:appName'),
      }}
      utilities={[
        {
          type: 'menu-dropdown',
          text: t('topNav.profile'),
          iconName: 'user-profile',
          items: [
            { id: 'profile', text: t('topNav.profile') },
            { id: 'signout', text: t('topNav.signOut') },
          ],
        },
      ]}
    />
  )
}
