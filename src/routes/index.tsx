import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('common:appName')}</h1>
    </div>
  )
}
