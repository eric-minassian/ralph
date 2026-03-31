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
import type { ResourceServerType } from '@aws-sdk/client-cognito-identity-provider'
import { useListResourceServers } from '../../../../api/hooks/useResourceServers'

export const Route = createFileRoute('/user-pools/$userPoolId/resource-servers/')({
  component: ResourceServerListPage,
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
      { id: 'identifier', label: 'Identifier' },
      { id: 'scopeCount', label: 'Number of scopes' },
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
  visibleContent: ['name', 'identifier', 'scopeCount'],
  wrapLines: false,
}

function ResourceServerListPage() {
  const { t } = useTranslation('resourceServers')
  const navigate = useNavigate()
  const { userPoolId } = Route.useParams()
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [sortingState, setSortingState] = useState<{
    sortingColumn: TableProps.SortingColumn<ResourceServerType>
    isDescending: boolean
  }>({
    sortingColumn: { sortingField: 'Name' },
    isDescending: false,
  })

  const { data, isLoading } = useListResourceServers({ UserPoolId: userPoolId, MaxResults: 60 })
  const allServers = useMemo(() => data?.ResourceServers ?? [], [data])

  const filteredServers = useMemo(() => {
    const lowerFilter = filterText.toLowerCase()
    const filtered = lowerFilter.length > 0
      ? allServers.filter(
          (rs) =>
            (rs.Name?.toLowerCase().includes(lowerFilter) ?? false) ||
            (rs.Identifier?.toLowerCase().includes(lowerFilter) ?? false),
        )
      : allServers

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
  }, [allServers, filterText, sortingState])

  const pageSize = preferences.pageSize
  const startIndex = (currentPage - 1) * pageSize
  const paginatedServers = filteredServers.slice(startIndex, startIndex + pageSize)
  const pagesCount = Math.max(1, Math.ceil(filteredServers.length / pageSize))

  const columnDefinitions: TableProps.ColumnDefinition<ResourceServerType>[] = [
    {
      id: 'name',
      header: t('list.columns.name'),
      cell: (item) => item.Name ?? '—',
      sortingField: 'Name',
      isRowHeader: true,
    },
    {
      id: 'identifier',
      header: t('list.columns.identifier'),
      cell: (item) => item.Identifier ?? '—',
      sortingField: 'Identifier',
    },
    {
      id: 'scopeCount',
      header: t('list.columns.scopeCount'),
      cell: (item) => String(item.Scopes?.length ?? 0),
      sortingField: 'ScopeCount',
    },
  ]

  const visibleColumns = columnDefinitions.filter((col) =>
    preferences.visibleContent.includes(col.id ?? ''),
  )

  return (
    <Table
      columnDefinitions={visibleColumns}
      items={paginatedServers}
      loading={isLoading}
      loadingText={t('common:loading')}
      trackBy={(item) => item.Identifier ?? ''}
      sortingColumn={sortingState.sortingColumn}
      sortingDescending={sortingState.isDescending}
      onSortingChange={({ detail }) => {
        setSortingState({
          sortingColumn: detail.sortingColumn,
          isDescending: detail.isDescending ?? false,
        })
      }}
      onRowClick={({ detail }) => {
        const identifier = detail.item.Identifier
        if (identifier) {
          void navigate({
            to: '/user-pools/$userPoolId/resource-servers/$identifier',
            params: { userPoolId, identifier: encodeURIComponent(identifier) },
          })
        }
      }}
      wrapLines={preferences.wrapLines}
      header={
        <Header
          counter={`(${String(filteredServers.length)})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                onClick={() => {
                  void navigate({
                    to: '/user-pools/$userPoolId/resource-servers/create',
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
                  to: '/user-pools/$userPoolId/resource-servers/create',
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

function getSortValue(rs: ResourceServerType, field: string): string | number | undefined {
  if (field === 'Name') return rs.Name
  if (field === 'Identifier') return rs.Identifier
  if (field === 'ScopeCount') return rs.Scopes?.length ?? 0
  return undefined
}
