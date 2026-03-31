import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/user-pools/$userPoolId/import/$jobId')({
  component: ImportJobLayout,
})

function ImportJobLayout() {
  return <Outlet />
}
