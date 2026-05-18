import { create } from 'zustand'

export interface AppNotification {
  id: string
  type: 'overdue' | 'due_today' | 'due_soon' | 'achievement' | 'level_up'
  title: string
  message: string
  color: string
  icon: string
  goalId?: string
  subGoalId?: string
  read: boolean
  created_at: string
}

interface NotificationStore {
  notifications: AppNotification[]
  unreadCount: number
  setNotifications: (notifs: AppNotification[]) => void
  markRead: (id: string) => void
  markAllRead: () => void
  addNotification: (notif: AppNotification) => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifs) => set({
    notifications: notifs,
    unreadCount: notifs.filter(n => !n.read).length,
  }),

  markRead: (id) => {
    const updated = get().notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    )
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length })
  },

  markAllRead: () => {
    set({
      notifications: get().notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    })
  },

  addNotification: (notif) => {
    const updated = [notif, ...get().notifications]
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length })
  },
}))