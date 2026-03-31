import { useState, useMemo, useCallback } from 'react'
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
import type { UserType, AttributeType } from '@aws-sdk/client-cognito-identity-provider'
import { useListUsers, useAdminEnableUser, useAdminDisableUser, useAdminDeleteUser } from '../../../../api/hooks/useUsers'

export const Route = createFileRoute('/user-pools/$userPoolId/users/')({
  component: UserListPage,
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
      { id: 'username', label: 'Username' },
      { id: 'email', label: 'Email' },
      { id: 'phone', label: 'Phone number' },
      { id: 'status', label: 'Status' },
      { id: 'enabled', label: 'Enabled' },
      { id: 'creationDate', label: 'Created' },
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
  visibleContent: ['username', 'email', 'phone', 'status', 'enabled', 'creationDate'],
  wrapLines: false,
}

function findAttribute(attributes: readonly AttributeType[] | undefined, name: string): string | undefined {
  if (!attributes) return undefined
  return attributes.find((a) => a.Name === name)?.Value
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

function statusIndicatorType(status: string | undefined): StatusIndicatorProps.Type {
  if (status === 'CONFIRMED') return 'success'
  if (status === 'FORCE_CHANGE_PASSWORD' || status === 'RESET_REQUIRED') return 'warning'
  if (status === 'COMPROMISED' || status === 'ARCHIVED') return 'error'
  if (status === 'UNCONFIRMED') return 'pending'
  if (status === 'EXTERNAL_PROVIDER') return 'info'
  return 'info'
}

function UserListPage() {
  const { t } = useTranslation('users')
  const navigate = useNavigate()
  const { userPoolId } = Route.useParams()
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [selectedItems, setSelectedItems] = useState<UserType[]>([])
  const [sortingState, setSortingState] = useState<{
    sortingColumn: TableProps.SortingColumn<UserType>
    isDescending: boolean
  }>({
    sortingColumn: { sortingField: 'Username' },
    isDescending: false,
  })

  const { data, isLoading } = useListUsers({ UserPoolId: userPoolId, Limit: 60 })
  const enableMutation = useAdminEnableUser()
  const disableMutation = useAdminDisableUser()
  const deleteMutation = useAdminDeleteUser()

  const allUsers = useMemo(() => data?.Users ?? [], [data])

  const filteredUsers = useMemo(() => {
    const lowerFilter = filterText.toLowerCase()
    const filtered = lowerFilter.length > 0
      ? allUsers.filter((user) => {
          const username = user.Username?.toLowerCase() ?? ''
          const email = findAttribute(user.Attributes, 'email')?.toLowerCase() ?? ''
          const phone = findAttribute(user.Attributes, 'phone_number')?.toLowerCase() ?? ''
          return username.includes(lowerFilter) ||
            email.includes(lowerFilter) ||
            phone.includes(lowerFilter)
        })
      : allUsers

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
  }, [allUsers, filterText, sortingState])

  const pageSize = preferences.pageSize
  const startIndex = (currentPage - 1) * pageSize
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize)
  const pagesCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize))

  const handleBulkEnable = useCallback(() => {
    for (const user of selectedItems) {
      if (user.Username) {
        enableMutation.mutate({ UserPoolId: userPoolId, Username: user.Username })
      }
    }
    setSelectedItems([])
  }, [selectedItems, enableMutation, userPoolId])

  const handleBulkDisable = useCallback(() => {
    for (const user of selectedItems) {
      if (user.Username) {
        disableMutation.mutate({ UserPoolId: userPoolId, Username: user.Username })
      }
    }
    setSelectedItems([])
  }, [selectedItems, disableMutation, userPoolId])

  const handleBulkDelete = useCallback(() => {
    for (const user of selectedItems) {
      if (user.Username) {
        deleteMutation.mutate({ UserPoolId: userPoolId, Username: user.Username })
      }
    }
    setSelectedItems([])
  }, [selectedItems, deleteMutation, userPoolId])

  const columnDefinitions: TableProps.ColumnDefinition<UserType>[] = [
    {
      id: 'username',
      header: t('list.columns.username'),
      cell: (item) => item.Username ?? '—',
      sortingField: 'Username',
      isRowHeader: true,
    },
    {
      id: 'email',
      header: t('list.columns.email'),
      cell: (item) => findAttribute(item.Attributes, 'email') ?? '—',
      sortingField: 'email',
    },
    {
      id: 'phone',
      header: t('list.columns.phone'),
      cell: (item) => findAttribute(item.Attributes, 'phone_number') ?? '—',
      sortingField: 'phone_number',
    },
    {
      id: 'status',
      header: t('list.columns.status'),
      cell: (item) => {
        const status = item.UserStatus ?? 'UNKNOWN'
        return (
          <StatusIndicator type={statusIndicatorType(status)}>
            {t(`status.${status}`)}
          </StatusIndicator>
        )
      },
      sortingField: 'UserStatus',
    },
    {
      id: 'enabled',
      header: t('list.columns.enabled'),
      cell: (item) => {
        const enabled = item.Enabled === true
        return (
          <StatusIndicator type={enabled ? 'success' : 'stopped'}>
            {t(`enabled.${String(enabled)}`)}
          </StatusIndicator>
        )
      },
      sortingField: 'Enabled',
    },
    {
      id: 'creationDate',
      header: t('list.columns.creationDate'),
      cell: (item) => formatDate(item.UserCreateDate),
      sortingField: 'UserCreateDate',
    },
    {
      id: 'lastModifiedDate',
      header: t('list.columns.lastModifiedDate'),
      cell: (item) => formatDate(item.UserLastModifiedDate),
      sortingField: 'UserLastModifiedDate',
    },
  ]

  const visibleColumns = columnDefinitions.filter((col) =>
    preferences.visibleContent.includes(col.id ?? ''),
  )

  return (
    <Table
      columnDefinitions={visibleColumns}
      items={paginatedUsers}
      loading={isLoading}
      loadingText={t('common:loading')}
      trackBy={(item) => item.Username ?? ''}
      selectionType="multi"
      selectedItems={selectedItems}
      onSelectionChange={({ detail }) => {
        setSelectedItems(detail.selectedItems)
      }}
      sortingColumn={sortingState.sortingColumn}
      sortingDescending={sortingState.isDescending}
      onSortingChange={({ detail }) => {
        setSortingState({
          sortingColumn: detail.sortingColumn,
          isDescending: detail.isDescending ?? false,
        })
      }}
      onRowClick={({ detail }) => {
        const username = detail.item.Username
        if (username) {
          void navigate({
            to: '/user-pools/$userPoolId/users/$username',
            params: { userPoolId, username },
          })
        }
      }}
      wrapLines={preferences.wrapLines}
      header={
        <Header
          counter={
            selectedItems.length > 0
              ? `(${String(selectedItems.length)}/${String(filteredUsers.length)})`
              : `(${String(filteredUsers.length)})`
          }
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                disabled={selectedItems.length === 0}
                onClick={handleBulkEnable}
              >
                {t('list.bulkActions.enable')}
              </Button>
              <Button
                disabled={selectedItems.length === 0}
                onClick={handleBulkDisable}
              >
                {t('list.bulkActions.disable')}
              </Button>
              <Button
                disabled={selectedItems.length === 0}
                onClick={handleBulkDelete}
              >
                {t('list.bulkActions.delete')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  void navigate({
                    to: '/user-pools/$userPoolId/users/create',
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
                  to: '/user-pools/$userPoolId/users/create',
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

function getSortValue(user: UserType, field: string): string | Date | boolean | undefined {
  if (field === 'Username') return user.Username
  if (field === 'email') return findAttribute(user.Attributes, 'email')
  if (field === 'phone_number') return findAttribute(user.Attributes, 'phone_number')
  if (field === 'UserStatus') return user.UserStatus
  if (field === 'Enabled') return user.Enabled === true ? 'Enabled' : 'Disabled'
  if (field === 'UserCreateDate') return user.UserCreateDate
  if (field === 'UserLastModifiedDate') return user.UserLastModifiedDate
  return undefined
}
