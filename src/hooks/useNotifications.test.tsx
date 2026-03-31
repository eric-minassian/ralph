import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { NotificationProvider } from '../contexts/NotificationProvider'
import { useNotifications } from './useNotifications'

function wrapper({ children }: { children: ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>
}

describe('useNotifications', () => {
  it('starts with empty notifications', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper })

    expect(result.current.notifications).toHaveLength(0)
  })

  it('adds a notification', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper })

    act(() => {
      result.current.addNotification({
        id: 'test-1',
        type: 'success',
        content: 'Test notification',
      })
    })

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0]?.type).toBe('success')
    expect(result.current.notifications[0]?.content).toBe('Test notification')
  })

  it('dismisses a notification', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper })

    act(() => {
      result.current.addNotification({
        id: 'test-1',
        type: 'info',
        content: 'Will be dismissed',
      })
    })

    expect(result.current.notifications).toHaveLength(1)

    act(() => {
      result.current.dismissNotification('test-1')
    })

    expect(result.current.notifications).toHaveLength(0)
  })

  it('adds in-progress notification with loading state', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper })

    act(() => {
      result.current.addNotification({
        id: 'loading-1',
        type: 'in-progress',
        content: 'Loading...',
      })
    })

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0]?.loading).toBe(true)
    expect(result.current.notifications[0]?.type).toBe('info')
  })

  it('replaces notification with same id', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper })

    act(() => {
      result.current.addNotification({
        id: 'test-1',
        type: 'info',
        content: 'Original',
      })
    })

    act(() => {
      result.current.addNotification({
        id: 'test-1',
        type: 'success',
        content: 'Updated',
      })
    })

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0]?.content).toBe('Updated')
    expect(result.current.notifications[0]?.type).toBe('success')
  })

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useNotifications())
    }).toThrow('useNotifications must be used within a NotificationProvider')
  })
})
