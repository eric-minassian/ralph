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
import type { GroupType } from '@aws-sdk/client-cognito-identity-provider'
import { useListGroups } from '../../../../api/hooks/useGroups'

export const Route = createFileRoute('/user-pools/$userPoolId/groups/')({
  component: GroupListPage,
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
      { id: 'groupName', label: 'Group name' },
      { id: 'description', label: 'Description' },
      { id: 'precedence', label: 'Precedence' },
      { id: 'roleArn', label: 'IAM role ARN' },
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
  visibleContent: ['groupName', 'description', 'precedence', 'creationDate', 'lastModifiedDate'],
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

function GroupListPage() {
  const { t } = useTranslation('groups')
  const navigate = useNavigate()
  const { userPoolId } = Route.useParams()
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [sortingState, setSortingState] = useState<{
    sortingColumn: TableProps.SortingColumn<GroupType>
    isDescending: boolean
  }>({
    sortingColumn: { sortingField: 'GroupName' },
    isDescending: false,
  })

  const { data, isLoading } = useListGroups({ UserPoolId: userPoolId, Limit: 60 })
  const allGroups = useMemo(() => data?.Groups ?? [], [data])

  const filteredGroups = useMemo(() => {
    const lowerFilter = filterText.toLowerCase()
    const filtered = lowerFilter.length > 0
      ? allGroups.filter(
          (group) =>
            (group.GroupName?.toLowerCase().includes(lowerFilter) ?? false) ||
            (group.Description?.toLowerCase().includes(lowerFilter) ?? false),
        )
      : allGroups

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
      if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime()
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      return isDescending ? -comparison : comparison
    })
  }, [allGroups, filterText, sortingState])

  const pageSize = preferences.pageSize
  const startIndex = (currentPage - 1) * pageSize
  const paginatedGroups = filteredGroups.slice(startIndex, startIndex + pageSize)
  const pagesCount = Math.max(1, Math.ceil(filteredGroups.length / pageSize))

  const columnDefinitions: TableProps.ColumnDefinition<GroupType>[] = [
    {
      id: 'groupName',
      header: t('list.columns.groupName'),
      cell: (item) => item.GroupName ?? '—',
      sortingField: 'GroupName',
      isRowHeader: true,
    },
    {
      id: 'description',
      header: t('list.columns.description'),
      cell: (item) => item.Description ?? '—',
    },
    {
      id: 'precedence',
      header: t('list.columns.precedence'),
      cell: (item) => item.Precedence !== undefined ? String(item.Precedence) : '—',
      sortingField: 'Precedence',
    },
    {
      id: 'roleArn',
      header: t('list.columns.roleArn'),
      cell: (item) => item.RoleArn ?? '—',
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
      items={paginatedGroups}
      loading={isLoading}
      loadingText={t('common:loading')}
      trackBy={(item) => item.GroupName ?? ''}
      sortingColumn={sortingState.sortingColumn}
      sortingDescending={sortingState.isDescending}
      onSortingChange={({ detail }) => {
        setSortingState({
          sortingColumn: detail.sortingColumn,
          isDescending: detail.isDescending ?? false,
        })
      }}
      onRowClick={({ detail }) => {
        const groupName = detail.item.GroupName
        if (groupName) {
          void navigate({
            to: '/user-pools/$userPoolId/groups/$groupName',
            params: { userPoolId, groupName },
          })
        }
      }}
      wrapLines={preferences.wrapLines}
      header={
        <Header
          counter={`(${String(filteredGroups.length)})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                onClick={() => {
                  void navigate({
                    to: '/user-pools/$userPoolId/groups/create',
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
                  to: '/user-pools/$userPoolId/groups/create',
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

function getSortValue(group: GroupType, field: string): string | Date | number | undefined {
  if (field === 'GroupName') return group.GroupName
  if (field === 'Precedence') return group.Precedence
  if (field === 'CreationDate') return group.CreationDate
  if (field === 'LastModifiedDate') return group.LastModifiedDate
  return undefined
}
