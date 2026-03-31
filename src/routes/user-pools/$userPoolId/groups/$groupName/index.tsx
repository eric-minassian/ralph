import { createFileRoute } from '@tanstack/react-router'
import { GroupDetailPage } from '../../../../../components/Groups/Detail/GroupDetailPage'

export const Route = createFileRoute('/user-pools/$userPoolId/groups/$groupName/')({
  component: GroupDetailRoute,
})

function GroupDetailRoute() {
  const { userPoolId, groupName } = Route.useParams()
  return <GroupDetailPage userPoolId={userPoolId} groupName={groupName} />
}
