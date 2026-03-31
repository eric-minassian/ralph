import { createFileRoute } from '@tanstack/react-router'
import { ResourceServerDetailPage } from '../../../../../components/ResourceServers/Detail/ResourceServerDetailPage'

export const Route = createFileRoute('/user-pools/$userPoolId/resource-servers/$identifier/')({
  component: ResourceServerDetailRoute,
})

function ResourceServerDetailRoute() {
  const { userPoolId, identifier } = Route.useParams()
  return <ResourceServerDetailPage userPoolId={userPoolId} identifier={decodeURIComponent(identifier)} />
}
