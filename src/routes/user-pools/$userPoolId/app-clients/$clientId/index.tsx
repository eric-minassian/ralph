import { createFileRoute } from '@tanstack/react-router'
import { AppClientDetailPage } from '../../../../../components/AppClients/Detail/AppClientDetailPage'

export const Route = createFileRoute('/user-pools/$userPoolId/app-clients/$clientId/')({
  component: AppClientDetailRoute,
})

function AppClientDetailRoute() {
  const { userPoolId, clientId } = Route.useParams()
  return <AppClientDetailPage userPoolId={userPoolId} clientId={clientId} />
}
