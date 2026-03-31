import { createFileRoute } from '@tanstack/react-router'
import { CreateUserPoolWizard } from '../../components/UserPools/CreateWizard'

export const Route = createFileRoute('/user-pools/create')({
  component: CreateUserPoolPage,
})

function CreateUserPoolPage() {
  return <CreateUserPoolWizard />
}
