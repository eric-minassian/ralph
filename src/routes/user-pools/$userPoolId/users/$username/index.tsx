import { createFileRoute } from '@tanstack/react-router'
import { UserDetailPage } from '../../../../../components/Users/Detail/UserDetailPage'

export const Route = createFileRoute('/user-pools/$userPoolId/users/$username/')({
  component: UserDetailRoute,
})

function UserDetailRoute() {
  const { userPoolId, username } = Route.useParams()
  return <UserDetailPage userPoolId={userPoolId} username={username} />
}
