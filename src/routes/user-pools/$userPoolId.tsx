import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/user-pools/$userPoolId')({
  component: UserPoolLayout,
})

function UserPoolLayout() {
  return <Outlet />
}
