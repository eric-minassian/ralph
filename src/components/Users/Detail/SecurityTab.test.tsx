import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test-utils'
import { userStore } from '../../../mocks/stores/userStore'
import {
  useAdminListUserAuthEvents,
  useAdminSetUserMFAPreference,
  useAdminUpdateAuthEventFeedback,
} from '../../../api/hooks/useUsers'
import type { AuthEventType } from '@aws-sdk/client-cognito-identity-provider'

const POOL_ID = 'us-east-1_TestPool'
const USERNAME = 'secuser'

// ── Auth Events Harness ───────────────────────────────────────────

function AuthEventsHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const { data, isLoading } = useAdminListUserAuthEvents({
    UserPoolId: userPoolId,
    Username: username,
    MaxResults: 10,
  })

  if (isLoading) return <div>Loading events...</div>

  const events = data?.AuthEvents ?? []

  return (
    <div>
      <span data-testid="event-count">{events.length}</span>
      {events.map((event: AuthEventType) => (
        <div key={event.EventId} data-testid={`event-${event.EventId ?? ''}`}>
          <span data-testid={`type-${event.EventId ?? ''}`}>{event.EventType}</span>
          <span data-testid={`response-${event.EventId ?? ''}`}>{event.EventResponse}</span>
          <span data-testid={`risk-${event.EventId ?? ''}`}>{event.EventRisk?.RiskLevel}</span>
          <span data-testid={`ip-${event.EventId ?? ''}`}>{event.EventContextData?.IpAddress}</span>
          <span data-testid={`feedback-${event.EventId ?? ''}`}>
            {event.EventFeedback?.FeedbackValue ?? 'none'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── MFA Preference Harness ────────────────────────────────────────

function MfaPreferenceHarness({ userPoolId, username }: { userPoolId: string; username: string }) {
  const setMfaPref = useAdminSetUserMFAPreference()

  return (
    <div>
      <button
        type="button"
        data-testid="set-mfa-btn"
        onClick={() => {
          setMfaPref.mutate({
            UserPoolId: userPoolId,
            Username: username,
            SMSMfaSettings: { Enabled: true, PreferredMfa: true },
            SoftwareTokenMfaSettings: { Enabled: true, PreferredMfa: false },
          })
        }}
      >
        Set MFA
      </button>
      <span data-testid="mfa-status">
        {setMfaPref.isSuccess ? 'done' : setMfaPref.isPending ? 'pending' : 'idle'}
      </span>
    </div>
  )
}

// ── Auth Event Feedback Harness ───────────────────────────────────

function FeedbackHarness({
  userPoolId,
  username,
  eventId,
}: {
  userPoolId: string
  username: string
  eventId: string
}) {
  const updateFeedback = useAdminUpdateAuthEventFeedback()

  return (
    <div>
      <button
        type="button"
        data-testid="feedback-valid-btn"
        onClick={() => {
          updateFeedback.mutate({
            UserPoolId: userPoolId,
            Username: username,
            EventId: eventId,
            FeedbackValue: 'Valid',
          })
        }}
      >
        Valid
      </button>
      <button
        type="button"
        data-testid="feedback-invalid-btn"
        onClick={() => {
          updateFeedback.mutate({
            UserPoolId: userPoolId,
            Username: username,
            EventId: eventId,
            FeedbackValue: 'Invalid',
          })
        }}
      >
        Invalid
      </button>
      <span data-testid="feedback-status">
        {updateFeedback.isSuccess ? 'done' : updateFeedback.isPending ? 'pending' : 'idle'}
      </span>
    </div>
  )
}

// ── Tests ──────────────────────────────────────────────────────────

describe('Security — Auth Events', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('lists auth events for a user', async () => {
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<AuthEventsHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('event-count')).toHaveTextContent('3')
    })
  })

  it('displays auth event details', async () => {
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<AuthEventsHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('event-count')).toHaveTextContent('3')
    })

    // Get the first event from the store to verify its details
    const events = userStore.listAuthEvents(POOL_ID, USERNAME, 10)
    const firstEvent = events.AuthEvents[0]
    expect(firstEvent).toBeDefined()

    if (firstEvent?.EventId) {
      expect(screen.getByTestId(`type-${firstEvent.EventId}`)).toHaveTextContent('SignIn')
      expect(screen.getByTestId(`response-${firstEvent.EventId}`)).toHaveTextContent('Pass')
      expect(screen.getByTestId(`risk-${firstEvent.EventId}`)).toHaveTextContent('Low')
      expect(screen.getByTestId(`ip-${firstEvent.EventId}`)).toHaveTextContent('203.0.113.42')
    }
  })

  it('shows no feedback initially', async () => {
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<AuthEventsHarness userPoolId={POOL_ID} username={USERNAME} />)

    await waitFor(() => {
      expect(screen.getByTestId('event-count')).toHaveTextContent('3')
    })

    const events = userStore.listAuthEvents(POOL_ID, USERNAME, 10)
    const firstEvent = events.AuthEvents[0]
    if (firstEvent?.EventId) {
      expect(screen.getByTestId(`feedback-${firstEvent.EventId}`)).toHaveTextContent('none')
    }
  })
})

describe('Security — MFA Preferences', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('sets MFA preferences via MSW', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    renderWithProviders(<MfaPreferenceHarness userPoolId={POOL_ID} username={USERNAME} />)

    await user.click(screen.getByTestId('set-mfa-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('mfa-status')).toHaveTextContent('done')
    })

    const pref = userStore.getMfaPreference(POOL_ID, USERNAME)
    expect(pref.smsEnabled).toBe(true)
    expect(pref.smsPreferred).toBe(true)
    expect(pref.softwareTokenEnabled).toBe(true)
    expect(pref.softwareTokenPreferred).toBe(false)
  })
})

describe('Security — Auth Event Feedback', () => {
  beforeEach(() => {
    userStore.clear()
  })

  it('submits valid feedback for an auth event', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    const events = userStore.listAuthEvents(POOL_ID, USERNAME, 10)
    const eventId = events.AuthEvents[0]?.EventId ?? ''

    renderWithProviders(
      <FeedbackHarness userPoolId={POOL_ID} username={USERNAME} eventId={eventId} />,
    )

    await user.click(screen.getByTestId('feedback-valid-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('feedback-status')).toHaveTextContent('done')
    })

    // Verify the feedback was stored
    const updatedEvents = userStore.listAuthEvents(POOL_ID, USERNAME, 10)
    const updatedEvent = updatedEvents.AuthEvents.find((e) => e.EventId === eventId)
    expect(updatedEvent?.EventFeedback?.FeedbackValue).toBe('Valid')
    expect(updatedEvent?.EventFeedback?.Provider).toBe('Admin')
  })

  it('submits invalid feedback for an auth event', async () => {
    const user = userEvent.setup()
    userStore.create(POOL_ID, { Username: USERNAME })

    const events = userStore.listAuthEvents(POOL_ID, USERNAME, 10)
    const eventId = events.AuthEvents[1]?.EventId ?? ''

    renderWithProviders(
      <FeedbackHarness userPoolId={POOL_ID} username={USERNAME} eventId={eventId} />,
    )

    await user.click(screen.getByTestId('feedback-invalid-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('feedback-status')).toHaveTextContent('done')
    })

    const updatedEvents = userStore.listAuthEvents(POOL_ID, USERNAME, 10)
    const updatedEvent = updatedEvents.AuthEvents.find((e) => e.EventId === eventId)
    expect(updatedEvent?.EventFeedback?.FeedbackValue).toBe('Invalid')
  })
})
