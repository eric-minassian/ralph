import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/user-pools/$userPoolId/users/$username')({
  component: UserLayout,
})

function UserLayout() {
  return <Outlet />
}
