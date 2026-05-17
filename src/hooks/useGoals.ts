'use client'

import { useEffect } from 'react'
import { useGoalsStore } from '@/store/goalsStore'
import { createClient } from '@/lib/supabase'

export function useGoals() {
  const { goals, loading, fetchGoals, addGoal, updateGoal, removeGoal } = useGoalsStore()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) fetchGoals(user.id)
    }
    load()
  }, [])

  return { goals, loading, addGoal, updateGoal, removeGoal }
}