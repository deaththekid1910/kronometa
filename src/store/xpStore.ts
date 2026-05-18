import { create } from 'zustand'
import { Achievement, LevelInfo, getLevelInfo } from '@/lib/gamification'

interface XPStore {
  totalXP: number
  levelInfo: LevelInfo
  newAchievements: Achievement[]
  showLevelUp: boolean
  previousLevel: number
  setXP: (xp: number) => void
  addXP: (amount: number) => void
  setNewAchievements: (achs: Achievement[]) => void
  clearAchievements: () => void
  closeLevelUp: () => void
}

export const useXPStore = create<XPStore>((set, get) => ({
  totalXP: 0,
  levelInfo: getLevelInfo(0),
  newAchievements: [],
  showLevelUp: false,
  previousLevel: 1,

  setXP: (xp) => {
    set({ totalXP: xp, levelInfo: getLevelInfo(xp) })
  },

  addXP: (amount) => {
    const { totalXP, levelInfo } = get()
    const prevLevel = levelInfo.level
    const newXP     = totalXP + amount
    const newInfo   = getLevelInfo(newXP)
    set({
      totalXP: newXP,
      levelInfo: newInfo,
      showLevelUp: newInfo.level > prevLevel,
      previousLevel: prevLevel,
    })
  },

  setNewAchievements: (achs) => set({ newAchievements: achs }),
  clearAchievements:  ()     => set({ newAchievements: [] }),
  closeLevelUp:       ()     => set({ showLevelUp: false }),
}))