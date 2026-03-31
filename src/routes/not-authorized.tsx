import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/not-authorized')({
  component: NotAuthorizedPage,
})

function NotAuthorizedPage() {
  const { t } = useTranslation('errors')

  return (
    <div>
      <h1>{t('notAuthorized.title')}</h1>
      <p>{t('notAuthorized.description')}</p>
      <Link to="/">{t('notAuthorized.goHome')}</Link>
    </div>
  )
}
