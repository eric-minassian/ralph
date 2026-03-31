import { useContext } from 'react'
import {
  NotificationContext,
  type NotificationContextValue,
} from '../contexts/notificationContext'

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (context === null) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider',
    )
  }
  return context
}
