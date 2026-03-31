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
import type { UserPoolClientDescription } from '@aws-sdk/client-cognito-identity-provider'
import { useListAppClients } from '../../../../api/hooks/useAppClients'

export const Route = createFileRoute('/user-pools/$userPoolId/app-clients/')({
  component: AppClientListPage,
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
      { id: 'clientName', label: 'Client name' },
      { id: 'clientId', label: 'Client ID' },
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
  visibleContent: ['clientName', 'clientId'],
  wrapLines: false,
}

function AppClientListPage() {
  const { t } = useTranslation('appClients')
  const navigate = useNavigate()
  const { userPoolId } = Route.useParams()
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [sortingState, setSortingState] = useState<{
    sortingColumn: TableProps.SortingColumn<UserPoolClientDescription>
    isDescending: boolean
  }>({
    sortingColumn: { sortingField: 'ClientName' },
    isDescending: false,
  })

  const { data, isLoading } = useListAppClients({ UserPoolId: userPoolId, MaxResults: 60 })
  const allClients = useMemo(() => data?.UserPoolClients ?? [], [data])

  const filteredClients = useMemo(() => {
    const lowerFilter = filterText.toLowerCase()
    const filtered = lowerFilter.length > 0
      ? allClients.filter(
          (client) =>
            (client.ClientName?.toLowerCase().includes(lowerFilter) ?? false) ||
            (client.ClientId?.toLowerCase().includes(lowerFilter) ?? false),
        )
      : allClients

    const { sortingColumn, isDescending } = sortingState
    const field = sortingColumn.sortingField
    if (!field) return filtered

    return [...filtered].sort((a, b) => {
      const aVal = getSortValue(a, field)
      const bVal = getSortValue(b, field)

      if (aVal === undefined && bVal === undefined) return 0
      if (aVal === undefined) return 1
      if (bVal === undefined) return -1

      const comparison = aVal.localeCompare(bVal)
      return isDescending ? -comparison : comparison
    })
  }, [allClients, filterText, sortingState])

  const pageSize = preferences.pageSize
  const startIndex = (currentPage - 1) * pageSize
  const paginatedClients = filteredClients.slice(startIndex, startIndex + pageSize)
  const pagesCount = Math.max(1, Math.ceil(filteredClients.length / pageSize))

  const columnDefinitions: TableProps.ColumnDefinition<UserPoolClientDescription>[] = [
    {
      id: 'clientName',
      header: t('list.columns.clientName'),
      cell: (item) => item.ClientName ?? '—',
      sortingField: 'ClientName',
      isRowHeader: true,
    },
    {
      id: 'clientId',
      header: t('list.columns.clientId'),
      cell: (item) => item.ClientId ?? '—',
      sortingField: 'ClientId',
    },
  ]

  const visibleColumns = columnDefinitions.filter((col) =>
    preferences.visibleContent.includes(col.id ?? ''),
  )

  return (
    <Table
      columnDefinitions={visibleColumns}
      items={paginatedClients}
      loading={isLoading}
      loadingText={t('common:loading')}
      trackBy={(item) => item.ClientId ?? ''}
      sortingColumn={sortingState.sortingColumn}
      sortingDescending={sortingState.isDescending}
      onSortingChange={({ detail }) => {
        setSortingState({
          sortingColumn: detail.sortingColumn,
          isDescending: detail.isDescending ?? false,
        })
      }}
      onRowClick={({ detail }) => {
        const clientId = detail.item.ClientId
        if (clientId) {
          void navigate({
            to: '/user-pools/$userPoolId/app-clients/$clientId',
            params: { userPoolId, clientId },
          })
        }
      }}
      wrapLines={preferences.wrapLines}
      header={
        <Header
          counter={`(${String(filteredClients.length)})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                onClick={() => {
                  void navigate({
                    to: '/user-pools/$userPoolId/app-clients/create',
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
                  to: '/user-pools/$userPoolId/app-clients/create',
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

function getSortValue(client: UserPoolClientDescription, field: string): string | undefined {
  if (field === 'ClientName') return client.ClientName
  if (field === 'ClientId') return client.ClientId
  return undefined
}
