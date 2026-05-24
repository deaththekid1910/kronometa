'use client'

import { useEffect } from 'react'
import { useGoalsStore } from '@/store/goalsStore'
import { createClient } from '@/lib/supabase'

export function useGoals(force = false) {
  const store = useGoalsStore()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) store.fetchGoals(user.id, force)
    }
    load()
  }, [])

  return store
}