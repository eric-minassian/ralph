import { createFileRoute } from '@tanstack/react-router'
import { DomainPage } from '../../../../components/Domains/DomainPage'

export const Route = createFileRoute('/user-pools/$userPoolId/domain/')({
  component: DomainRoute,
})

function DomainRoute() {
  const { userPoolId } = Route.useParams()
  return <DomainPage userPoolId={userPoolId} />
}
