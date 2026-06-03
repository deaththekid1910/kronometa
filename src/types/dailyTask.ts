export interface DailyTask {
  id: string
  user_id: string
  title: string
  description?: string | null
  reminder_time?: string | null   // 'HH:MM' o null
  task_date: string               // 'YYYY-MM-DD' (día al que pertenece, zona horaria del usuario)
  completed_at?: string | null
  timezone: string
  created_at: string
}
