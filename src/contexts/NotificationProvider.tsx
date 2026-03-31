import { useCallback, useMemo, useState } from 'react'
import type { FlashbarProps } from '@cloudscape-design/components/flashbar'
import {
  NotificationContext,
  type Notification,
  type NotificationContextValue,
} from './notificationContext'

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [items, setItems] = useState<FlashbarProps.MessageDefinition[]>([])

  const dismissNotification = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const addNotification = useCallback(
    (notification: Notification) => {
      const item: FlashbarProps.MessageDefinition = {
        id: notification.id,
        type: notification.type === 'in-progress' ? 'info' : notification.type,
        loading: notification.type === 'in-progress',
        content: notification.content,
        dismissible: notification.dismissible ?? true,
        onDismiss: () => {
          dismissNotification(notification.id)
        },
      }

      setItems((prev) => {
        const filtered = prev.filter((existing) => existing.id !== notification.id)
        return [item, ...filtered]
      })
    },
    [dismissNotification],
  )

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications: items,
      addNotification,
      dismissNotification,
    }),
    [items, addNotification, dismissNotification],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
