import { createClient } from '@/lib/supabase'
import { AppNotification } from '@/store/notificationStore'

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const supabase = createClient()
  const notifs: AppNotification[] = []
  const now     = new Date()
  const today   = now.toISOString().split('T')[0]

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const in3days = new Date(now)
  in3days.setDate(in3days.getDate() + 3)
  const in3daysStr = in3days.toISOString().split('T')[0]

  const { data: goals } = await supabase
    .from('goals')
    .select('id, title, color, type, deadline')
    .eq('user_id', userId)
    .eq('archived', false)

  if (!goals) return []

  const goalIds = goals.map(g => g.id)

  const { data: subGoals } = await supabase
    .from('sub_goals')
    .select('id, goal_id, title, due_date, due_time, completed_at')
    .in('goal_id', goalIds)
    .is('completed_at', null)
    .not('due_date', 'is', null)

  for (const sg of subGoals || []) {
    const goal = goals.find(g => g.id === sg.goal_id)
    if (!goal) continue

    if (sg.due_date < today) {
      notifs.push({
        id:        `overdue-${sg.id}`,
        type:      'overdue',
        title:     'Submeta vencida',
        message:   `"${sg.title}" de ${goal.title} venció el ${new Date(sg.due_date + 'T12:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}`,
        color:     '#FF3860',
        icon:      '🔴',
        goalId:    sg.goal_id,
        subGoalId: sg.id,
        read:      false,
        created_at: new Date().toISOString(),
      })
    } else if (sg.due_date === today) {
      notifs.push({
        id:        `today-${sg.id}`,
        type:      'due_today',
        title:     'Vence hoy',
        message:   `"${sg.title}" de ${goal.title} vence hoy${sg.due_time ? ' a las ' + sg.due_time.slice(0, 5) : ''}`,
        color:     '#FFB800',
        icon:      '⚡',
        goalId:    sg.goal_id,
        subGoalId: sg.id,
        read:      false,
        created_at: new Date().toISOString(),
      })
    } else if (sg.due_date === tomorrowStr) {
      notifs.push({
        id:        `tomorrow-${sg.id}`,
        type:      'due_soon',
        title:     'Vence mañana',
        message:   `"${sg.title}" de ${goal.title} vence mañana`,
        color:     '#FFB800',
        icon:      '⏰',
        goalId:    sg.goal_id,
        subGoalId: sg.id,
        read:      false,
        created_at: new Date().toISOString(),
      })
    } else if (sg.due_date <= in3daysStr) {
      notifs.push({
        id:        `soon-${sg.id}`,
        type:      'due_soon',
        title:     'Próximo vencimiento',
        message:   `"${sg.title}" de ${goal.title} vence el ${new Date(sg.due_date + 'T12:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}`,
        color:     '#00F5FF',
        icon:      '📅',
        goalId:    sg.goal_id,
        subGoalId: sg.id,
        read:      false,
        created_at: new Date().toISOString(),
      })
    }
  }

  for (const goal of goals) {
    if (!goal.deadline) continue
    const deadline = goal.deadline.split('T')[0]

    if (deadline < today) {
      notifs.push({
        id:      `goal-overdue-${goal.id}`,
        type:    'overdue',
        title:   'Meta vencida',
        message: `La meta "${goal.title}" venció el ${new Date(goal.deadline).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}`,
        color:   '#FF3860',
        icon:    '🚨',
        goalId:  goal.id,
        read:    false,
        created_at: new Date().toISOString(),
      })
    } else if (deadline === today) {
      notifs.push({
        id:      `goal-today-${goal.id}`,
        type:    'due_today',
        title:   'Meta vence hoy',
        message: `"${goal.title}" tiene fecha límite hoy`,
        color:   '#FFB800',
        icon:    '🎯',
        goalId:  goal.id,
        read:    false,
        created_at: new Date().toISOString(),
      })
    } else if (deadline <= in3daysStr) {
      notifs.push({
        id:      `goal-soon-${goal.id}`,
        type:    'due_soon',
        title:   'Meta próxima a vencer',
        message: `"${goal.title}" vence el ${new Date(goal.deadline).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}`,
        color:   '#00F5FF',
        icon:    '⏳',
        goalId:  goal.id,
        read:    false,
        created_at: new Date().toISOString(),
      })
    }
  }

  notifs.sort((a, b) => {
    const order = { overdue: 0, due_today: 1, due_soon: 2, achievement: 3, level_up: 4 }
    return order[a.type] - order[b.type]
  })

  return notifs
}