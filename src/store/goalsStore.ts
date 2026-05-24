import { create } from 'zustand'
import { Goal, SubGoal, GoalWithStats } from '@/types'
import { createClient } from '@/lib/supabase'

interface GoalsStore {
  goals: GoalWithStats[]
  loading: boolean
  lastFetched: number | null
  fetchGoals: (userId: string, force?: boolean) => Promise<void>
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  removeGoal: (id: string) => void
  addSubGoal: (subGoal: SubGoal) => void
  completeSubGoal: (goalId: string, subGoalId: string) => void
  uncompleteSubGoal: (goalId: string, subGoalId: string) => void
}

const CACHE_MS = 60_000 // 1 minuto de caché

export const useGoalsStore = create<GoalsStore>((set, get) => ({
  goals: [],
  loading: false,
  lastFetched: null,

  fetchGoals: async (userId, force = false) => {
    const { lastFetched, loading } = get()
    const now = Date.now()

    // Evita refetch si los datos son frescos
    if (!force && lastFetched && now - lastFetched < CACHE_MS) return
    if (loading) return

    set({ loading: true })
    const supabase = createClient()

    const { data: goals } = await supabase
      .from('goals')
      .select(`*, sub_goals(*), avatar_state(*)`)
      .eq('user_id', userId)
      .eq('archived', false)
      .order('created_at', { ascending: false })

    if (goals) {
      const mapped: GoalWithStats[] = goals.map(g => ({
        ...g,
        sub_goals: (g.sub_goals || []).sort(
          (a: SubGoal, b: SubGoal) => a.order_index - b.order_index
        ),
        avatar_state: g.avatar_state?.[0],
      }))
      set({ goals: mapped, lastFetched: now })
    }
    set({ loading: false })
  },

  addGoal: (goal) => set(s => ({ goals: [goal as GoalWithStats, ...s.goals] })),

  updateGoal: (id, updates) => set(s => ({
    goals: s.goals.map(g => g.id === id ? { ...g, ...updates } : g)
  })),

  removeGoal: (id) => set(s => ({
    goals: s.goals.filter(g => g.id !== id)
  })),

  addSubGoal: (subGoal) => set(s => ({
    goals: s.goals.map(g =>
      g.id === subGoal.goal_id
        ? { ...g, sub_goals: [...(g.sub_goals || []), subGoal] }
        : g
    )
  })),

  completeSubGoal: (goalId, subGoalId) => set(s => ({
    goals: s.goals.map(g =>
      g.id === goalId
        ? { ...g, sub_goals: g.sub_goals?.map(sg =>
            sg.id === subGoalId ? { ...sg, completed_at: new Date().toISOString() } : sg
          )}
        : g
    )
  })),

  uncompleteSubGoal: (goalId, subGoalId) => set(s => ({
    goals: s.goals.map(g =>
      g.id === goalId
        ? { ...g, sub_goals: g.sub_goals?.map(sg =>
            sg.id === subGoalId ? { ...sg, completed_at: undefined } : sg
          )}
        : g
    )
  })),
}))