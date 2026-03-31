import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Box from '@cloudscape-design/components/box'
import Button from '@cloudscape-design/components/button'
import Table from '@cloudscape-design/components/table'
import Modal from '@cloudscape-design/components/modal'
import Checkbox from '@cloudscape-design/components/checkbox'
import StatusIndicator from '@cloudscape-design/components/status-indicator'
import Pagination from '@cloudscape-design/components/pagination'
import type { AuthEventType } from '@aws-sdk/client-cognito-identity-provider'
import {
  useAdminListUserAuthEvents,
  useAdminSetUserMFAPreference,
  useAdminUpdateAuthEventFeedback,
} from '../../../api/hooks/useUsers'
import { useNotifications } from '../../../hooks/useNotifications'
import { PermissionGate } from '../../PermissionGate'

interface SecurityTabProps {
  userPoolId: string
  username: string
}

interface MfaEditState {
  smsEnabled: boolean
  smsPreferred: boolean
  totpEnabled: boolean
  totpPreferred: boolean
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

function eventResponseIndicator(response: string | undefined): 'success' | 'error' | 'in-progress' {
  switch (response) {
    case 'Pass': return 'success'
    case 'Fail': return 'error'
    default: return 'in-progress'
  }
}

function riskLevelIndicator(level: string | undefined): 'success' | 'warning' | 'error' | 'info' {
  switch (level) {
    case 'Low': return 'success'
    case 'Medium': return 'warning'
    case 'High': return 'error'
    default: return 'info'
  }
}

export function SecurityTab({ userPoolId, username }: SecurityTabProps) {
  const { t } = useTranslation('users')
  const { addNotification } = useNotifications()

  const authEventsQuery = useAdminListUserAuthEvents({
    UserPoolId: userPoolId,
    Username: username,
    MaxResults: 10,
  })

  const setMfaPref = useAdminSetUserMFAPreference()
  const updateFeedback = useAdminUpdateAuthEventFeedback()

  const [mfaEditModal, setMfaEditModal] = useState<MfaEditState | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const authEvents = authEventsQuery.data?.AuthEvents ?? []

  // ── MFA Preferences Section ──────────────────────────────────────

  const handleOpenMfaEdit = () => {
    setMfaEditModal({
      smsEnabled: false,
      smsPreferred: false,
      totpEnabled: false,
      totpPreferred: false,
    })
  }

  const handleSaveMfaPreference = () => {
    if (!mfaEditModal) return
    setMfaPref.mutate(
      {
        UserPoolId: userPoolId,
        Username: username,
        SMSMfaSettings: {
          Enabled: mfaEditModal.smsEnabled,
          PreferredMfa: mfaEditModal.smsPreferred,
        },
        SoftwareTokenMfaSettings: {
          Enabled: mfaEditModal.totpEnabled,
          PreferredMfa: mfaEditModal.totpPreferred,
        },
      },
      {
        onSuccess: () => {
          addNotification({
            id: `mfa-pref-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.setMfaPreferenceSuccess'),
            dismissible: true,
          })
          setMfaEditModal(null)
        },
        onError: () => {
          addNotification({
            id: `mfa-pref-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.setMfaPreferenceError'),
            dismissible: true,
          })
        },
      },
    )
  }

  // ── Auth Event Feedback ──────────────────────────────────────────

  const handleFeedback = (eventId: string, feedbackValue: 'Valid' | 'Invalid') => {
    updateFeedback.mutate(
      {
        UserPoolId: userPoolId,
        Username: username,
        EventId: eventId,
        FeedbackValue: feedbackValue,
      },
      {
        onSuccess: () => {
          addNotification({
            id: `feedback-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.authEventFeedbackSuccess'),
            dismissible: true,
          })
        },
        onError: () => {
          addNotification({
            id: `feedback-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.authEventFeedbackError'),
            dismissible: true,
          })
        },
      },
    )
  }

  return (
    <SpaceBetween size="l">
      {/* MFA Preferences */}
      <Container
        header={
          <Header
            variant="h2"
            actions={
              <PermissionGate permission="AdminSetUserMFAPreference">
                <Button onClick={handleOpenMfaEdit}>
                  {t('detail.security.mfa.editButton')}
                </Button>
              </PermissionGate>
            }
          >
            {t('detail.security.mfa.title')}
          </Header>
        }
      >
        <ColumnLayout columns={2} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">{t('detail.security.mfa.sms')}</Box>
            <div>
              <StatusIndicator type="stopped">
                {t('detail.security.mfa.disabled')}
              </StatusIndicator>
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">{t('detail.security.mfa.totp')}</Box>
            <div>
              <StatusIndicator type="stopped">
                {t('detail.security.mfa.disabled')}
              </StatusIndicator>
            </div>
          </div>
        </ColumnLayout>
      </Container>

      {/* Auth Events Table */}
      <Container
        header={
          <Header variant="h2">
            {t('detail.security.authEvents.title')}
          </Header>
        }
      >
        <Table
          columnDefinitions={[
            {
              id: 'eventId',
              header: t('detail.security.authEvents.eventId'),
              cell: (item: AuthEventType) => {
                const id = item.EventId ?? '—'
                return id.length > 8 ? `${id.substring(0, 8)}...` : id
              },
              width: 120,
            },
            {
              id: 'eventType',
              header: t('detail.security.authEvents.eventType'),
              cell: (item: AuthEventType) => item.EventType ?? '—',
            },
            {
              id: 'creationDate',
              header: t('detail.security.authEvents.creationDate'),
              cell: (item: AuthEventType) => formatDate(item.CreationDate),
            },
            {
              id: 'eventResponse',
              header: t('detail.security.authEvents.eventResponse'),
              cell: (item: AuthEventType) => (
                <StatusIndicator type={eventResponseIndicator(item.EventResponse)}>
                  {item.EventResponse ?? '—'}
                </StatusIndicator>
              ),
            },
            {
              id: 'riskLevel',
              header: t('detail.security.authEvents.riskLevel'),
              cell: (item: AuthEventType) => (
                <StatusIndicator type={riskLevelIndicator(item.EventRisk?.RiskLevel)}>
                  {item.EventRisk?.RiskLevel ?? '—'}
                </StatusIndicator>
              ),
            },
            {
              id: 'ipAddress',
              header: t('detail.security.authEvents.ipAddress'),
              cell: (item: AuthEventType) => item.EventContextData?.IpAddress ?? '—',
            },
            {
              id: 'feedback',
              header: t('detail.security.authEvents.feedback'),
              cell: (item: AuthEventType) => {
                if (item.EventFeedback?.FeedbackValue) {
                  return (
                    <StatusIndicator type={item.EventFeedback.FeedbackValue === 'Valid' ? 'success' : 'error'}>
                      {item.EventFeedback.FeedbackValue}
                    </StatusIndicator>
                  )
                }
                return (
                  <PermissionGate permission="AdminUpdateAuthEventFeedback">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        variant="inline-link"
                        onClick={() => { handleFeedback(item.EventId ?? '', 'Valid') }}
                      >
                        {t('detail.security.authEvents.feedbackValid')}
                      </Button>
                      <Button
                        variant="inline-link"
                        onClick={() => { handleFeedback(item.EventId ?? '', 'Invalid') }}
                      >
                        {t('detail.security.authEvents.feedbackInvalid')}
                      </Button>
                    </SpaceBetween>
                  </PermissionGate>
                )
              },
            },
          ]}
          items={authEvents}
          loading={authEventsQuery.isLoading}
          variant="embedded"
          empty={
            <Box textAlign="center" color="text-body-secondary" padding="s">
              {t('detail.security.authEvents.noEvents')}
            </Box>
          }
          pagination={
            <Pagination
              currentPageIndex={currentPage}
              pagesCount={authEventsQuery.data?.NextToken ? currentPage + 1 : currentPage}
              onChange={({ detail }) => { setCurrentPage(detail.currentPageIndex) }}
            />
          }
        />
      </Container>

      {/* MFA Edit Modal */}
      {mfaEditModal !== null && (
        <Modal
          visible
          onDismiss={() => { setMfaEditModal(null) }}
          header={t('detail.security.mfa.editModal.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setMfaEditModal(null) }}>
                  {t('detail.security.mfa.editModal.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveMfaPreference}
                  loading={setMfaPref.isPending}
                >
                  {t('detail.security.mfa.editModal.submitButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="l">
            <Checkbox
              checked={mfaEditModal.smsEnabled}
              onChange={({ detail }) => {
                setMfaEditModal({
                  ...mfaEditModal,
                  smsEnabled: detail.checked,
                  smsPreferred: detail.checked ? mfaEditModal.smsPreferred : false,
                })
              }}
            >
              {t('detail.security.mfa.editModal.smsEnabled')}
            </Checkbox>
            <Checkbox
              checked={mfaEditModal.smsPreferred}
              onChange={({ detail }) => { setMfaEditModal({ ...mfaEditModal, smsPreferred: detail.checked }) }}
              disabled={!mfaEditModal.smsEnabled}
            >
              {t('detail.security.mfa.editModal.smsPreferred')}
            </Checkbox>
            <Checkbox
              checked={mfaEditModal.totpEnabled}
              onChange={({ detail }) => {
                setMfaEditModal({
                  ...mfaEditModal,
                  totpEnabled: detail.checked,
                  totpPreferred: detail.checked ? mfaEditModal.totpPreferred : false,
                })
              }}
            >
              {t('detail.security.mfa.editModal.totpEnabled')}
            </Checkbox>
            <Checkbox
              checked={mfaEditModal.totpPreferred}
              onChange={({ detail }) => { setMfaEditModal({ ...mfaEditModal, totpPreferred: detail.checked }) }}
              disabled={!mfaEditModal.totpEnabled}
            >
              {t('detail.security.mfa.editModal.totpPreferred')}
            </Checkbox>
          </SpaceBetween>
        </Modal>
      )}
    </SpaceBetween>
  )
}
