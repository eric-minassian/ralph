import { createFileRoute } from '@tanstack/react-router'
import { CreateUserForm } from '../../../../components/Users/CreateUserForm'

export const Route = createFileRoute('/user-pools/$userPoolId/users/create')({
  component: CreateUserPage,
})

function CreateUserPage() {
  const { userPoolId } = Route.useParams()
  return <CreateUserForm userPoolId={userPoolId} />
}
