import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Table from '@cloudscape-design/components/table'
import type { TableProps } from '@cloudscape-design/components/table'
import Header from '@cloudscape-design/components/header'
import Button from '@cloudscape-design/components/button'
import ButtonDropdown from '@cloudscape-design/components/button-dropdown'
import TextFilter from '@cloudscape-design/components/text-filter'
import Pagination from '@cloudscape-design/components/pagination'
import CollectionPreferences from '@cloudscape-design/components/collection-preferences'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Box from '@cloudscape-design/components/box'
import type { ProviderDescription } from '@aws-sdk/client-cognito-identity-provider'
import { useListIdentityProviders } from '../../../../api/hooks/useIdentityProviders'

export const Route = createFileRoute('/user-pools/$userPoolId/identity-providers/')({
  component: IdentityProviderListPage,
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
      { id: 'providerName', label: 'Provider name' },
      { id: 'providerType', label: 'Provider type' },
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
  visibleContent: ['providerName', 'providerType', 'creationDate', 'lastModifiedDate'],
  wrapLines: false,
}

const PROVIDER_TYPE_ITEMS = [
  { id: 'SAML', text: 'SAML' },
  { id: 'OIDC', text: 'OIDC' },
  { id: 'Facebook', text: 'Facebook' },
  { id: 'Google', text: 'Google' },
  { id: 'LoginWithAmazon', text: 'Login with Amazon' },
  { id: 'SignInWithApple', text: 'Sign in with Apple' },
]

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

function getProviderTypeLabel(type: string | undefined): string {
  if (!type) return '—'
  const item = PROVIDER_TYPE_ITEMS.find((i) => i.id === type)
  return item?.text ?? type
}

function IdentityProviderListPage() {
  const { t } = useTranslation('identityProviders')
  const navigate = useNavigate()
  const { userPoolId } = Route.useParams()
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [sortingState, setSortingState] = useState<{
    sortingColumn: TableProps.SortingColumn<ProviderDescription>
    isDescending: boolean
  }>({
    sortingColumn: { sortingField: 'ProviderName' },
    isDescending: false,
  })

  const { data, isLoading } = useListIdentityProviders({ UserPoolId: userPoolId, MaxResults: 60 })
  const allProviders = useMemo(() => data?.Providers ?? [], [data])

  const filteredProviders = useMemo(() => {
    const lowerFilter = filterText.toLowerCase()
    const filtered = lowerFilter.length > 0
      ? allProviders.filter(
          (provider) =>
            (provider.ProviderName?.toLowerCase().includes(lowerFilter) ?? false) ||
            (provider.ProviderType?.toLowerCase().includes(lowerFilter) ?? false),
        )
      : allProviders

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
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      return isDescending ? -comparison : comparison
    })
  }, [allProviders, filterText, sortingState])

  const pageSize = preferences.pageSize
  const startIndex = (currentPage - 1) * pageSize
  const paginatedProviders = filteredProviders.slice(startIndex, startIndex + pageSize)
  const pagesCount = Math.max(1, Math.ceil(filteredProviders.length / pageSize))

  const columnDefinitions: TableProps.ColumnDefinition<ProviderDescription>[] = [
    {
      id: 'providerName',
      header: t('list.columns.providerName'),
      cell: (item) => item.ProviderName ?? '—',
      sortingField: 'ProviderName',
      isRowHeader: true,
    },
    {
      id: 'providerType',
      header: t('list.columns.providerType'),
      cell: (item) => getProviderTypeLabel(item.ProviderType),
      sortingField: 'ProviderType',
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
      items={paginatedProviders}
      loading={isLoading}
      loadingText={t('common:loading')}
      trackBy={(item) => item.ProviderName ?? ''}
      sortingColumn={sortingState.sortingColumn}
      sortingDescending={sortingState.isDescending}
      onSortingChange={({ detail }) => {
        setSortingState({
          sortingColumn: detail.sortingColumn,
          isDescending: detail.isDescending ?? false,
        })
      }}
      onRowClick={({ detail }) => {
        const providerName = detail.item.ProviderName
        if (providerName) {
          void navigate({
            to: '/user-pools/$userPoolId/identity-providers/$providerName',
            params: { userPoolId, providerName },
          })
        }
      }}
      wrapLines={preferences.wrapLines}
      header={
        <Header
          counter={`(${String(filteredProviders.length)})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <ButtonDropdown
                variant="primary"
                items={PROVIDER_TYPE_ITEMS}
                onItemClick={({ detail }) => {
                  void navigate({
                    to: '/user-pools/$userPoolId/identity-providers/create',
                    params: { userPoolId },
                    search: { type: detail.id },
                  })
                }}
              >
                {t('list.createButton')}
              </ButtonDropdown>
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
                  to: '/user-pools/$userPoolId/identity-providers/create',
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

function getSortValue(provider: ProviderDescription, field: string): string | Date | undefined {
  if (field === 'ProviderName') return provider.ProviderName
  if (field === 'ProviderType') return provider.ProviderType
  if (field === 'CreationDate') return provider.CreationDate
  if (field === 'LastModifiedDate') return provider.LastModifiedDate
  return undefined
}
