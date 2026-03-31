import { createContext } from 'react'
import type { FlashbarProps } from '@cloudscape-design/components/flashbar'

export type NotificationType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'in-progress'

export interface Notification {
  id: string
  type: NotificationType
  content: string
  dismissible?: boolean
  loading?: boolean
}

export interface NotificationContextValue {
  notifications: readonly FlashbarProps.MessageDefinition[]
  addNotification: (notification: Notification) => void
  dismissNotification: (id: string) => void
}

export const NotificationContext =
  createContext<NotificationContextValue | null>(null)
