import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/user-pools/$userPoolId/app-clients/$clientId')({
  component: AppClientLayout,
})

function AppClientLayout() {
  return <Outlet />
}
