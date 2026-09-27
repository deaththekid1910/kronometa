export interface BinanceProfile {
  user_id: string
  first_name: string
  last_name: string
  email?: string | null
  binance_uid?: string | null     // Binance ID / Pay ID
  currency: string                // 'USDT', 'USDC', 'USD'...
  balance: number                 // saldo registrado (lo mantiene el usuario)
  created_at: string
  updated_at: string
}

export type SavingsStatus = 'active' | 'completed' | 'withdrawn'

export interface SavingsGoal {
  id: string
  user_id: string
  title: string
  target_amount: number
  icon: string
  color: string
  status: SavingsStatus
  completed_at?: string | null
  withdrawn_at?: string | null
  withdrawn_amount?: number | null
  created_at: string
}

export interface SavingsContribution {
  id: string
  goal_id: string
  user_id: string
  amount: number
  note?: string | null
  created_at: string
}

export interface BalanceMove {
  id: string
  user_id: string
  delta: number
  balance_after: number
  reason: string
  goal_id?: string | null
  created_at: string
}

export interface SavingsGoalWithProgress extends SavingsGoal {
  contributions: SavingsContribution[]
  saved: number                   // suma de abonos
  pct: number                     // 0-100 (limitado a 100)
  remaining: number               // lo que falta (0 si ya se logró)
}
