import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Table from '@cloudscape-design/components/table'
import type { TableProps } from '@cloudscape-design/components/table'
import Header from '@cloudscape-design/components/header'
import Button from '@cloudscape-design/components/button'
import TextFilter from '@cloudscape-design/components/text-filter'
import Pagination from '@cloudscape-design/components/pagination'
import CollectionPreferences from '@cloudscape-design/components/collection-preferences'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Box from '@cloudscape-design/components/box'
import StatusIndicator from '@cloudscape-design/components/status-indicator'
import type { StatusIndicatorProps } from '@cloudscape-design/components/status-indicator'
import type { UserImportJobType } from '@aws-sdk/client-cognito-identity-provider'
import { useListUserImportJobs } from '../../../../api/hooks/useUserImport'

export const Route = createFileRoute('/user-pools/$userPoolId/import/')({
  component: ImportJobListPage,
})

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
]

const VISIBLE_CONTENT_OPTIONS = [
  {
    label: 'Properties',
    options: [
      { id: 'jobName', label: 'Job name' },
      { id: 'status', label: 'Status' },
      { id: 'creationDate', label: 'Created' },
      { id: 'startDate', label: 'Started' },
      { id: 'completionDate', label: 'Completed' },
      { id: 'importedUsers', label: 'Imported' },
      { id: 'skippedUsers', label: 'Skipped' },
      { id: 'failedUsers', label: 'Failed' },
    ],
  },
]

interface Preferences {
  pageSize: number
  visibleContent: readonly string[]
  wrapLines: boolean
}

const DEFAULT_PREFERENCES: Preferences = {
  pageSize: 20,
  visibleContent: ['jobName', 'status', 'creationDate', 'startDate', 'completionDate', 'importedUsers', 'skippedUsers', 'failedUsers'],
  wrapLines: false,
}

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

function ImportJobListPage() {
  const { t } = useTranslation('import')
  const navigate = useNavigate()
  const { userPoolId } = Route.useParams()
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [sortingState, setSortingState] = useState<{
    sortingColumn: TableProps.SortingColumn<UserImportJobType>
    isDescending: boolean
  }>({
    sortingColumn: { sortingField: 'CreationDate' },
    isDescending: true,
  })

  const { data, isLoading } = useListUserImportJobs({ UserPoolId: userPoolId, MaxResults: 60 })
  const allJobs = useMemo(() => data?.UserImportJobs ?? [], [data])

  const filteredJobs = useMemo(() => {
    const lowerFilter = filterText.toLowerCase()
    const filtered = lowerFilter.length > 0
      ? allJobs.filter(
          (job) =>
            (job.JobName?.toLowerCase().includes(lowerFilter) ?? false) ||
            (job.JobId?.toLowerCase().includes(lowerFilter) ?? false),
        )
      : allJobs

    const { sortingColumn, isDescending } = sortingState
    const field = sortingColumn.sortingField
    if (!field) return filtered

    return [...filtered].sort((a, b) => {
      const aVal = getSortValue(a, field)
      const bVal = getSortValue(b, field)

      if (aVal === undefined && bVal === undefined) return 0
      if (aVal === undefined) return 1
      if (bVal === undefined) return -1

      let comparison = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      return isDescending ? -comparison : comparison
    })
  }, [allJobs, filterText, sortingState])

  const pageSize = preferences.pageSize
  const startIndex = (currentPage - 1) * pageSize
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + pageSize)
  const pagesCount = Math.max(1, Math.ceil(filteredJobs.length / pageSize))

  const columnDefinitions: TableProps.ColumnDefinition<UserImportJobType>[] = [
    {
      id: 'jobName',
      header: t('list.columns.jobName'),
      cell: (item) => item.JobName ?? '—',
      sortingField: 'JobName',
      isRowHeader: true,
    },
    {
      id: 'status',
      header: t('list.columns.status'),
      cell: (item) => (
        <StatusIndicator type={getStatusType(item.Status)}>
          {t(`list.status.${item.Status ?? 'Created'}`)}
        </StatusIndicator>
      ),
      sortingField: 'Status',
    },
    {
      id: 'creationDate',
      header: t('list.columns.creationDate'),
      cell: (item) => formatDate(item.CreationDate),
      sortingField: 'CreationDate',
    },
    {
      id: 'startDate',
      header: t('list.columns.startDate'),
      cell: (item) => formatDate(item.StartDate),
      sortingField: 'StartDate',
    },
    {
      id: 'completionDate',
      header: t('list.columns.completionDate'),
      cell: (item) => formatDate(item.CompletionDate),
      sortingField: 'CompletionDate',
    },
    {
      id: 'importedUsers',
      header: t('list.columns.importedUsers'),
      cell: (item) => String(item.ImportedUsers ?? 0),
      sortingField: 'ImportedUsers',
    },
    {
      id: 'skippedUsers',
      header: t('list.columns.skippedUsers'),
      cell: (item) => String(item.SkippedUsers ?? 0),
      sortingField: 'SkippedUsers',
    },
    {
      id: 'failedUsers',
      header: t('list.columns.failedUsers'),
      cell: (item) => String(item.FailedUsers ?? 0),
      sortingField: 'FailedUsers',
    },
  ]

  const visibleColumns = columnDefinitions.filter((col) =>
    preferences.visibleContent.includes(col.id ?? ''),
  )

  return (
    <Table
      columnDefinitions={visibleColumns}
      items={paginatedJobs}
      loading={isLoading}
      loadingText={t('common:loading')}
      trackBy={(item) => item.JobId ?? ''}
      sortingColumn={sortingState.sortingColumn}
      sortingDescending={sortingState.isDescending}
      onSortingChange={({ detail }) => {
        setSortingState({
          sortingColumn: detail.sortingColumn,
          isDescending: detail.isDescending ?? false,
        })
      }}
      onRowClick={({ detail }) => {
        const jobId = detail.item.JobId
        if (jobId) {
          void navigate({
            to: '/user-pools/$userPoolId/import/$jobId',
            params: { userPoolId, jobId },
          })
        }
      }}
      wrapLines={preferences.wrapLines}
      header={
        <Header
          counter={`(${String(filteredJobs.length)})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                onClick={() => {
                  void navigate({
                    to: '/user-pools/$userPoolId/import/create',
                    params: { userPoolId },
                  })
                }}
              >
                {t('list.createButton')}
              </Button>
            </SpaceBetween>
          }
        >
          {t('list.title')}
        </Header>
      }
      filter={
        <TextFilter
          filteringPlaceholder={t('list.searchPlaceholder')}
          filteringText={filterText}
          onChange={({ detail }) => {
            setFilterText(detail.filteringText)
            setCurrentPage(1)
          }}
        />
      }
      pagination={
        <Pagination
          currentPageIndex={currentPage}
          pagesCount={pagesCount}
          onChange={({ detail }) => {
            setCurrentPage(detail.currentPageIndex)
          }}
        />
      }
      preferences={
        <CollectionPreferences
          title={t('list.preferences.title')}
          confirmLabel={t('common:confirm')}
          cancelLabel={t('common:cancel')}
          preferences={{
            pageSize: preferences.pageSize,
            visibleContent: [...preferences.visibleContent],
            wrapLines: preferences.wrapLines,
          }}
          pageSizePreference={{
            title: t('list.preferences.pageSize'),
            options: PAGE_SIZE_OPTIONS,
          }}
          visibleContentPreference={{
            title: t('list.preferences.columns'),
            options: [...VISIBLE_CONTENT_OPTIONS],
          }}
          wrapLinesPreference={{
            label: t('list.preferences.wrapLines'),
          }}
          onConfirm={({ detail }) => {
            setPreferences({
              pageSize: detail.pageSize ?? DEFAULT_PREFERENCES.pageSize,
              visibleContent: detail.visibleContent ?? DEFAULT_PREFERENCES.visibleContent,
              wrapLines: detail.wrapLines ?? DEFAULT_PREFERENCES.wrapLines,
            })
            setCurrentPage(1)
          }}
        />
      }
      empty={
        <Box textAlign="center" color="text-body-secondary" padding="l">
          <SpaceBetween size="m">
            <Box variant="strong" color="text-body-secondary">
              {t('list.emptyTitle')}
            </Box>
            <Box color="text-body-secondary">
              {t('list.emptyDescription')}
            </Box>
            <Button
              onClick={() => {
                void navigate({
                  to: '/user-pools/$userPoolId/import/create',
                  params: { userPoolId },
                })
              }}
            >
              {t('list.emptyAction')}
            </Button>
          </SpaceBetween>
        </Box>
      }
    />
  )
}

function getSortValue(job: UserImportJobType, field: string): string | number | undefined {
  if (field === 'JobName') return job.JobName
  if (field === 'Status') return job.Status
  if (field === 'CreationDate') return job.CreationDate?.getTime()
  if (field === 'StartDate') return job.StartDate?.getTime()
  if (field === 'CompletionDate') return job.CompletionDate?.getTime()
  if (field === 'ImportedUsers') return job.ImportedUsers ?? 0
  if (field === 'SkippedUsers') return job.SkippedUsers ?? 0
  if (field === 'FailedUsers') return job.FailedUsers ?? 0
  return undefined
}
