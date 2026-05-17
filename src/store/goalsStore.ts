import { create } from 'zustand'
import { Goal, SubGoal, GoalWithStats } from '@/types'
import { createClient } from '@/lib/supabase'

interface GoalsStore {
  goals: GoalWithStats[]
  loading: boolean
  fetchGoals: (userId: string) => Promise<void>
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  removeGoal: (id: string) => void
  addSubGoal: (subGoal: SubGoal) => void
  completeSubGoal: (goalId: string, subGoalId: string) => void
}

export const useGoalsStore = create<GoalsStore>((set, get) => ({
  goals: [],
  loading: false,

  fetchGoals: async (userId: string) => {
    set({ loading: true })
    const supabase = createClient()

    const { data: goals } = await supabase
      .from('goals')
      .select(`
        *,
        sub_goals(*),
        avatar_state(*)
      `)
      .eq('user_id', userId)
      .eq('archived', false)
      .order('created_at', { ascending: false })

    if (goals) {
      const goalsWithStats: GoalWithStats[] = goals.map(g => ({
        ...g,
        sub_goals: g.sub_goals?.sort(
          (a: SubGoal, b: SubGoal) => a.order_index - b.order_index
        ),
        avatar_state: g.avatar_state?.[0]
      }))
      set({ goals: goalsWithStats })
    }
    set({ loading: false })
  },

  addGoal: (goal) => {
    set(state => ({ goals: [goal, ...state.goals] }))
  },

  updateGoal: (id, updates) => {
    set(state => ({
      goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g)
    }))
  },

  removeGoal: (id) => {
    set(state => ({ goals: state.goals.filter(g => g.id !== id) }))
  },

  addSubGoal: (subGoal) => {
    set(state => ({
      goals: state.goals.map(g =>
        g.id === subGoal.goal_id
          ? { ...g, sub_goals: [...(g.sub_goals || []), subGoal] }
          : g
      )
    }))
  },

  completeSubGoal: (goalId, subGoalId) => {
    set(state => ({
      goals: state.goals.map(g =>
        g.id === goalId
          ? {
            ...g,
            sub_goals: g.sub_goals?.map(sg =>
              sg.id === subGoalId
                ? { ...sg, completed_at: new Date().toISOString() }
                : sg
            )
          }
          : g
      )
    }))
  }
}))