import { createFileRoute } from '@tanstack/react-router'
import { IdentityProviderDetailPage } from '../../../../../components/IdentityProviders/Detail/IdentityProviderDetailPage'

export const Route = createFileRoute('/user-pools/$userPoolId/identity-providers/$providerName/')({
  component: IdentityProviderDetailRoute,
})

function IdentityProviderDetailRoute() {
  const { userPoolId, providerName } = Route.useParams()
  return <IdentityProviderDetailPage userPoolId={userPoolId} providerName={providerName} />
}
