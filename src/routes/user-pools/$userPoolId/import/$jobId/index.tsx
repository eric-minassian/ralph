import { createFileRoute } from '@tanstack/react-router'
import { ImportJobDetailPage } from '../../../../../components/UserImport/ImportJobDetailPage'

export const Route = createFileRoute('/user-pools/$userPoolId/import/$jobId/')({
  component: ImportJobDetailRoute,
})

function ImportJobDetailRoute() {
  const { userPoolId, jobId } = Route.useParams()
  return <ImportJobDetailPage userPoolId={userPoolId} jobId={jobId} />
}
