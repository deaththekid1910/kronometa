import { createClient } from '@/lib/supabase'

export interface Achievement {
  key: string
  title: string
  description: string
  icon: string
  xp: number
  color: string
  unlocked?: boolean
  unlocked_at?: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { key: 'first_goal',       title: 'Primer Paso',        description: 'Crea tu primera meta',                   icon: '🎯', xp: 50,   color: '#00F5FF' },
  { key: 'first_habit',      title: 'Nuevo Hábito',       description: 'Crea tu primer hábito',                  icon: '🔄', xp: 50,   color: '#00FF88' },
  { key: 'first_subgoal',    title: 'Divide y Vencerás',  description: 'Completa tu primera submeta',            icon: '✅', xp: 75,   color: '#00F5FF' },
  { key: 'first_timer',      title: 'Crononauta',         description: 'Activa tu primer cronómetro',            icon: '⏱',  xp: 25,   color: '#FFB800' },
  { key: 'timer_1h',         title: 'Una Hora Sólida',    description: 'Acumula 1 hora en una meta',             icon: '🕐', xp: 100,  color: '#FFB800' },
  { key: 'timer_10h',        title: 'Maratonista',        description: 'Acumula 10 horas en una meta',           icon: '🏃', xp: 300,  color: '#FFB800' },
  { key: 'habit_3streak',    title: 'Racha Inicial',      description: 'Mantén un hábito 3 días seguidos',       icon: '🔥', xp: 100,  color: '#FF3860' },
  { key: 'habit_7streak',    title: 'Semana Perfecta',    description: 'Mantén un hábito 7 días seguidos',       icon: '⚡', xp: 200,  color: '#B026FF' },
  { key: 'habit_21streak',   title: 'Hábito Forjado',     description: 'Mantén un hábito 21 días seguidos',      icon: '💎', xp: 500,  color: '#00F5FF' },
  { key: 'goal_complete',    title: 'Meta Conquistada',   description: 'Completa todas las submetas de una meta', icon: '🏆', xp: 400,  color: '#FFB800' },
  { key: 'goals_3',          title: 'Multi-Proyecto',     description: 'Ten 3 metas activas simultáneas',        icon: '🚀', xp: 150,  color: '#B026FF' },
  { key: 'level_5',          title: 'Nivel 5',            description: 'Alcanza el nivel 5',                     icon: '⭐', xp: 0,    color: '#FFB800' },
  { key: 'level_10',         title: 'Nivel 10',           description: 'Alcanza el nivel 10',                    icon: '🌟', xp: 0,    color: '#00F5FF' },
  { key: 'subgoals_10',      title: 'Productividad Total','description': 'Completa 10 submetas en total',        icon: '💪', xp: 250,  color: '#00FF88' },
]

export interface LevelInfo {
  level: number
  xp: number
  xpForNext: number
  xpInLevel: number
  progress: number
  title: string
}

const LEVEL_TITLES = [
  'Iniciado', 'Aprendiz', 'Explorador', 'Aventurero', 'Guerrero',
  'Campeón', 'Héroe', 'Leyenda', 'Maestro', 'Gran Maestro', 'Inmortal'
]

export function getLevelInfo(totalXP: number): LevelInfo {
  let level = 1
  let xpRequired = 0
  let xpForNext  = 100

  while (totalXP >= xpRequired + xpForNext && level < 50) {
    xpRequired += xpForNext
    level++
    xpForNext = Math.round(xpForNext * 1.4)
  }

  const xpInLevel  = totalXP - xpRequired
  const progress   = Math.round((xpInLevel / xpForNext) * 100)
  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1)

  return { level, xp: totalXP, xpForNext, xpInLevel, progress, title: LEVEL_TITLES[titleIndex] }
}

export async function getUserXP(userId: string): Promise<number> {
  const supabase = createClient()
  const { data: avatar } = await supabase
    .from('avatar_state')
    .select('xp_total')
    .eq('user_id', userId)

  if (!avatar || avatar.length === 0) return 0
  return avatar.reduce((sum, a) => sum + (a.xp_total || 0), 0)
}

export async function awardXP(userId: string, goalId: string, amount: number): Promise<number> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('avatar_state')
    .select('xp_total, id')
    .eq('user_id', userId)
    .eq('goal_id', goalId)
    .single()

  if (existing) {
    const newXP = (existing.xp_total || 0) + amount
    await supabase
      .from('avatar_state')
      .update({ xp_total: newXP })
      .eq('id', existing.id)
    return newXP
  }
  return 0
}

export async function unlockAchievement(userId: string, key: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('achievements')
    .insert({ user_id: userId, key })

  return !error
}

export async function getUserAchievements(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('achievements')
    .select('key, unlocked_at')
    .eq('user_id', userId)
  return (data || []).map(a => a.key)
}

export async function checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
  const supabase  = createClient()
  const unlocked  = await getUserAchievements(userId)
  const newOnes: Achievement[] = []

  const check = async (key: string, condition: () => Promise<boolean>) => {
    if (unlocked.includes(key)) return
    if (await condition()) {
      const wasNew = await unlockAchievement(userId, key)
      if (wasNew) {
        const ach = ACHIEVEMENTS.find(a => a.key === key)
        if (ach) newOnes.push(ach)
      }
    }
  }

  const { data: goals } = await supabase
    .from('goals').select('id, type').eq('user_id', userId)

  const { data: subGoals } = await supabase
    .from('sub_goals')
    .select('id, goal_id, completed_at')
    .in('goal_id', (goals || []).map(g => g.id))

  const { data: sessions } = await supabase
    .from('timer_sessions')
    .select('elapsed_seconds, goal_id')
    .eq('user_id', userId)

  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select('logged_date, goal_id')
    .eq('user_id', userId)
    .order('logged_date', { ascending: false })

  const totalGoals   = (goals || []).filter(g => g.type === 'goal').length
  const totalHabits  = (goals || []).filter(g => g.type === 'habit').length
  const completedSub = (subGoals || []).filter(s => s.completed_at).length

  const totalTimeBySess = (sessions || []).reduce((a, s) => a + (s.elapsed_seconds || 0), 0)

  const getMaxStreak = (goalId: string) => {
    const dates = (habitLogs || [])
      .filter(l => l.goal_id === goalId)
      .map(l => l.logged_date)
      .sort()
    let max = 0, cur = 0, prev = ''
    for (const d of dates) {
      if (prev) {
        const diff = (new Date(d).getTime() - new Date(prev).getTime()) / 86400000
        cur = diff === 1 ? cur + 1 : 1
      } else cur = 1
      max  = Math.max(max, cur)
      prev = d
    }
    return max
  }

  const maxStreak = Math.max(0, ...(goals || [])
    .filter(g => g.type === 'habit')
    .map(g => getMaxStreak(g.id)))

  const totalXP = await getUserXP(userId)
  const level   = getLevelInfo(totalXP).level

  await check('first_goal',    async () => totalGoals >= 1)
  await check('first_habit',   async () => totalHabits >= 1)
  await check('first_subgoal', async () => completedSub >= 1)
  await check('first_timer',   async () => totalTimeBySess > 0)
  await check('timer_1h',      async () => totalTimeBySess >= 3600)
  await check('timer_10h',     async () => totalTimeBySess >= 36000)
  await check('habit_3streak', async () => maxStreak >= 3)
  await check('habit_7streak', async () => maxStreak >= 7)
  await check('habit_21streak',async () => maxStreak >= 21)
  await check('goals_3',       async () => totalGoals >= 3)
  await check('subgoals_10',   async () => completedSub >= 10)
  await check('level_5',       async () => level >= 5)
  await check('level_10',      async () => level >= 10)

  const goalCompletionChecks = (goals || []).filter(g => g.type === 'goal')
  for (const goal of goalCompletionChecks) {
    const subs      = (subGoals || []).filter(s => s.goal_id === goal.id)
    const allDone   = subs.length > 0 && subs.every(s => s.completed_at)
    await check('goal_complete', async () => allDone)
  }

  return newOnes
}