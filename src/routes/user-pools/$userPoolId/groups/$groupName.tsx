import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/user-pools/$userPoolId/groups/$groupName')({
  component: GroupLayout,
})

function GroupLayout() {
  return <Outlet />
}
