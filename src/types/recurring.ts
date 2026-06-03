export interface RecurringTask {
  id: string
  goal_id: string
  user_id: string
  title: string
  description?: string
  frequency: 'daily' | 'weekly'
  target_count: number
  deadline: string
  color: string
  archived: boolean
  notification_times: string[]
  order_index: number
  created_at: string
}

export interface RecurringTaskLog {
  id: string
  task_id: string
  user_id: string
  logged_date: string
  count: number
  notes?: string
  timezone: string
  created_at: string
}

export interface RecurringTaskWithLogs extends RecurringTask {
  logs: RecurringTaskLog[]
  todayLog?: RecurringTaskLog
  streak: number
  totalDays: number
  daysRemaining: number
  completionPct: number
}