import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/user-pools/$userPoolId/resource-servers/$identifier')({
  component: ResourceServerLayout,
})

function ResourceServerLayout() {
  return <Outlet />
}
