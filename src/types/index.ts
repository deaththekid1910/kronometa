export type GoalType = 'goal' | 'habit'

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  type: GoalType
  icon: string
  color: string
  deadline?: string
  timezone: string
  archived: boolean
  created_at: string
  updated_at: string
}

export interface SubGoal {
  id: string
  goal_id: string
  title: string
  description?: string
  order_index: number
  completed_at?: string
  due_date?: string
  due_time?: string
  notes?: string
  created_at: string
}

export interface TimerSession {
  id: string
  user_id: string
  goal_id: string
  started_at?: string
  ended_at?: string
  elapsed_seconds: number
  is_active: boolean
  created_at: string
}

export interface HabitLog {
  id: string
  goal_id: string
  user_id: string
  logged_date: string
  duration_seconds: number
  notes?: string
  timezone: string
  created_at: string
}

export interface AvatarState {
  id: string
  user_id: string
  goal_id: string
  current_subgoal_index: number
  xp_total: number
  level: number
  skin_id: string
  updated_at: string
}

export interface GoalWithStats extends Goal {
  sub_goals?: SubGoal[]
  avatar_state?: AvatarState
  total_seconds?: number
  active_session?: TimerSession
}