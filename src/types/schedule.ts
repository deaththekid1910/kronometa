export interface ScheduleBlock {
  id: string
  user_id: string
  title: string
  description?: string | null
  days_of_week: number[]      // 0=Domingo ... 6=Sábado (convención JS getDay)
  start_time: string          // 'HH:MM'
  end_time?: string | null    // 'HH:MM' o null
  color: string
  notify: boolean
  active: boolean
  timezone: string
  created_at: string
}
