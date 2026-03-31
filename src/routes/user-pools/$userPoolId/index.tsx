import { createFileRoute } from '@tanstack/react-router'
import { UserPoolDetailPage } from '../../../components/UserPools/Detail/UserPoolDetailPage'

export const Route = createFileRoute('/user-pools/$userPoolId/')({
  component: UserPoolDetailRoute,
})

function UserPoolDetailRoute() {
  const { userPoolId } = Route.useParams()
  return <UserPoolDetailPage userPoolId={userPoolId} />
}
