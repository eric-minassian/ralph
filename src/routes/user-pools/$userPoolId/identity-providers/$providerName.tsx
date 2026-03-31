import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/user-pools/$userPoolId/identity-providers/$providerName')({
  component: IdentityProviderLayout,
})

function IdentityProviderLayout() {
  return <Outlet />
}
