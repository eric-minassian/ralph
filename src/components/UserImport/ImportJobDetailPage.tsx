import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Header from '@cloudscape-design/components/header'
import Button from '@cloudscape-design/components/button'
import Box from '@cloudscape-design/components/box'
import Spinner from '@cloudscape-design/components/spinner'
import Alert from '@cloudscape-design/components/alert'
import Container from '@cloudscape-design/components/container'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Modal from '@cloudscape-design/components/modal'
import StatusIndicator from '@cloudscape-design/components/status-indicator'
import type { StatusIndicatorProps } from '@cloudscape-design/components/status-indicator'
import { useDescribeUserImportJob, useStartUserImportJob, useStopUserImportJob } from '../../api/hooks/useUserImport'
import { useNotifications } from '../../hooks/useNotifications'
import { PermissionGate } from '../PermissionGate'

interface ImportJobDetailPageProps {
  userPoolId: string
  jobId: string
}

type ModalState =
  | { type: 'start' }
  | { type: 'stop' }

function getStatusType(status: string | undefined): StatusIndicatorProps.Type {
  switch (status) {
    case 'Succeeded':
      return 'success'
    case 'Failed':
    case 'Expired':
      return 'error'
    case 'Stopped':
      return 'stopped'
    case 'InProgress':
    case 'Pending':
    case 'Stopping':
      return 'in-progress'
    case 'Created':
      return 'info'
    default:
      return 'info'
  }
}

function isActiveStatus(status: string | undefined): boolean {
  return status === 'Pending' || status === 'InProgress' || status === 'Stopping'
}

function formatDate(date: Date | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ImportJobDetailPage({ userPoolId, jobId }: ImportJobDetailPageProps) {
  const { t } = useTranslation('import')
  const navigate = useNavigate()
  const { addNotification } = useNotifications()

  const jobQuery = useDescribeUserImportJob(userPoolId, jobId)
  const startJob = useStartUserImportJob()
  const stopJob = useStopUserImportJob()

  const [modal, setModal] = useState<ModalState | null>(null)

  const { data, isLoading, isError } = jobQuery
  const job = data?.UserImportJob

  const isActive = isActiveStatus(job?.Status)

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
        <Box variant="p" padding="s">{t('detail.loading')}</Box>
      </Box>
    )
  }

  if (isError || !job) {
    return (
      <Alert
        type="error"
        header={t('detail.notFound')}
        action={
          <Button onClick={() => {
            void navigate({ to: '/user-pools/$userPoolId/import', params: { userPoolId } })
          }}>
            {t('detail.backToList')}
          </Button>
        }
      >
        {t('detail.notFoundDescription')}
      </Alert>
    )
  }

  const canStart = job.Status === 'Created'
  const canStop = job.Status === 'Pending' || job.Status === 'InProgress'

  const handleStart = () => {
    startJob.mutate(
      { UserPoolId: userPoolId, JobId: jobId },
      {
        onSuccess: () => {
          addNotification({
            id: `start-import-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.startSuccess', { name: job.JobName ?? jobId }),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `start-import-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.startError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleStop = () => {
    stopJob.mutate(
      { UserPoolId: userPoolId, JobId: jobId },
      {
        onSuccess: () => {
          addNotification({
            id: `stop-import-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.stopSuccess', { name: job.JobName ?? jobId }),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `stop-import-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.stopError'),
            dismissible: true,
          })
        },
      },
    )
  }

  return (
    <>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {canStart && (
                <PermissionGate permission="StartUserImportJob">
                  <Button variant="primary" onClick={() => { setModal({ type: 'start' }) }}>
                    {t('detail.startButton')}
                  </Button>
                </PermissionGate>
              )}
              {canStop && (
                <PermissionGate permission="StopUserImportJob">
                  <Button onClick={() => { setModal({ type: 'stop' }) }}>
                    {t('detail.stopButton')}
                  </Button>
                </PermissionGate>
              )}
            </SpaceBetween>
          }
        >
          {t('detail.title', { name: job.JobName ?? jobId })}
        </Header>

        {/* General settings */}
        <Container header={<Header variant="h2">{t('detail.general.title')}</Header>}>
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">{t('detail.general.jobId')}</Box>
              <div>{job.JobId ?? t('detail.general.noneSet')}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.jobName')}</Box>
              <div>{job.JobName ?? t('detail.general.noneSet')}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.status')}</Box>
              <StatusIndicator type={getStatusType(job.Status)}>
                {t(`list.status.${job.Status ?? 'Created'}`)}
              </StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.iamRoleArn')}</Box>
              <div>{job.CloudWatchLogsRoleArn ?? t('detail.general.noneSet')}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.creationDate')}</Box>
              <div>{formatDate(job.CreationDate)}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.startDate')}</Box>
              <div>{job.StartDate ? formatDate(job.StartDate) : t('detail.general.notStarted')}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.completionDate')}</Box>
              <div>{job.CompletionDate ? formatDate(job.CompletionDate) : t('detail.general.notCompleted')}</div>
            </div>
            {job.CompletionMessage ? (
              <div>
                <Box variant="awsui-key-label">{t('detail.general.completionMessage')}</Box>
                <div>{job.CompletionMessage}</div>
              </div>
            ) : null}
          </ColumnLayout>
        </Container>

        {/* Progress stats */}
        <Container header={<Header variant="h2">{t('detail.progress.title')}</Header>}>
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">{t('detail.progress.importedUsers')}</Box>
              <div>{String(job.ImportedUsers ?? 0)}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.progress.skippedUsers')}</Box>
              <div>{String(job.SkippedUsers ?? 0)}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.progress.failedUsers')}</Box>
              <div>{String(job.FailedUsers ?? 0)}</div>
            </div>
          </ColumnLayout>
        </Container>

        {/* Pre-signed URL (only for Created status) */}
        {job.PreSignedUrl && canStart && (
          <Container header={<Header variant="h2">{t('detail.preSignedUrl.title')}</Header>}>
            <SpaceBetween size="s">
              <Box>{t('detail.preSignedUrl.description')}</Box>
              <Box variant="code" fontSize="body-s">
                {job.PreSignedUrl}
              </Box>
            </SpaceBetween>
          </Container>
        )}

        {/* Auto-refresh indicator */}
        {isActive && (
          <Box textAlign="center" color="text-body-secondary" padding="s">
            <StatusIndicator type="in-progress">
              {t('common:autoRefreshing')}
            </StatusIndicator>
          </Box>
        )}
      </SpaceBetween>

      {/* Start confirmation modal */}
      {modal?.type === 'start' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.start.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.start.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleStart}
                  loading={startJob.isPending}
                >
                  {t('detail.start.startButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('detail.start.description')}
        </Modal>
      )}

      {/* Stop confirmation modal */}
      {modal?.type === 'stop' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.stop.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.stop.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleStop}
                  loading={stopJob.isPending}
                >
                  {t('detail.stop.stopButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('detail.stop.description')}
        </Modal>
      )}
    </>
  )
}
