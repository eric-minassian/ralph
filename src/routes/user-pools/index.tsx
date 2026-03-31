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
import type { UserPoolDescriptionType } from '@aws-sdk/client-cognito-identity-provider'
import { useListUserPools } from '../../api/hooks/useUserPools'

export const Route = createFileRoute('/user-pools/')({
  component: UserPoolListPage,
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
      { id: 'name', label: 'Name' },
      { id: 'id', label: 'ID' },
      { id: 'status', label: 'Status' },
      { id: 'creationDate', label: 'Creation date' },
      { id: 'lastModifiedDate', label: 'Last modified' },
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
  visibleContent: ['name', 'id', 'status', 'creationDate', 'lastModifiedDate'],
  wrapLines: false,
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

function UserPoolListPage() {
  const { t } = useTranslation('userPools')
  const navigate = useNavigate()
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [sortingState, setSortingState] = useState<{
    sortingColumn: TableProps.SortingColumn<UserPoolDescriptionType>
    isDescending: boolean
  }>({
    sortingColumn: { sortingField: 'Name' },
    isDescending: false,
  })

  const { data, isLoading } = useListUserPools({ MaxResults: 60 })
  const allPools = useMemo(() => data?.UserPools ?? [], [data])

  const filteredPools = useMemo(() => {
    const lowerFilter = filterText.toLowerCase()
    const filtered = lowerFilter.length > 0
      ? allPools.filter(
          (pool) =>
            (pool.Name?.toLowerCase().includes(lowerFilter) ?? false) ||
            (pool.Id?.toLowerCase().includes(lowerFilter) ?? false),
        )
      : allPools

    const { sortingColumn, isDescending } = sortingState
    const field = sortingColumn.sortingField
    if (!field) return filtered

    return [...filtered].sort((a, b) => {
      const aVal = field === 'Name' ? a.Name
        : field === 'Id' ? a.Id
        : field === 'CreationDate' ? a.CreationDate
        : field === 'LastModifiedDate' ? a.LastModifiedDate
        : undefined
      const bVal = field === 'Name' ? b.Name
        : field === 'Id' ? b.Id
        : field === 'CreationDate' ? b.CreationDate
        : field === 'LastModifiedDate' ? b.LastModifiedDate
        : undefined

      if (aVal === undefined && bVal === undefined) return 0
      if (aVal === undefined) return 1
      if (bVal === undefined) return -1

      let comparison = 0
      if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime()
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      return isDescending ? -comparison : comparison
    })
  }, [allPools, filterText, sortingState])

  const pageSize = preferences.pageSize
  const startIndex = (currentPage - 1) * pageSize
  const paginatedPools = filteredPools.slice(startIndex, startIndex + pageSize)
  const pagesCount = Math.max(1, Math.ceil(filteredPools.length / pageSize))

  const columnDefinitions: TableProps.ColumnDefinition<UserPoolDescriptionType>[] = [
    {
      id: 'name',
      header: t('list.columns.name'),
      cell: (item) => item.Name ?? '—',
      sortingField: 'Name',
      isRowHeader: true,
    },
    {
      id: 'id',
      header: t('list.columns.id'),
      cell: (item) => item.Id ?? '—',
      sortingField: 'Id',
    },
    {
      id: 'status',
      header: t('list.columns.status'),
      cell: () => (
        <StatusIndicator type="success">
          {t('status.Enabled')}
        </StatusIndicator>
      ),
    },
    {
      id: 'creationDate',
      header: t('list.columns.creationDate'),
      cell: (item) => formatDate(item.CreationDate),
      sortingField: 'CreationDate',
    },
    {
      id: 'lastModifiedDate',
      header: t('list.columns.lastModifiedDate'),
      cell: (item) => formatDate(item.LastModifiedDate),
      sortingField: 'LastModifiedDate',
    },
  ]

  const visibleColumns = columnDefinitions.filter((col) =>
    preferences.visibleContent.includes(col.id ?? ''),
  )

  return (
    <Table
      columnDefinitions={visibleColumns}
      items={paginatedPools}
      loading={isLoading}
      loadingText={t('common:loading')}
      trackBy={(item) => item.Id ?? ''}
      sortingColumn={sortingState.sortingColumn}
      sortingDescending={sortingState.isDescending}
      onSortingChange={({ detail }) => {
        setSortingState({
          sortingColumn: detail.sortingColumn,
          isDescending: detail.isDescending ?? false,
        })
      }}
      onRowClick={({ detail }) => {
        const poolId = detail.item.Id
        if (poolId) {
          void navigate({ to: '/user-pools/$userPoolId', params: { userPoolId: poolId } })
        }
      }}
      wrapLines={preferences.wrapLines}
      header={
        <Header
          counter={`(${String(filteredPools.length)})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                onClick={() => {
                  void navigate({ to: '/user-pools' })
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
                void navigate({ to: '/user-pools' })
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
