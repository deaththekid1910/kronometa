// Fechas en la zona horaria LOCAL del usuario ('YYYY-MM-DD').
// Los registros de hábitos se guardan con la fecha local, así que "hoy" y las
// rachas deben calcularse igual: con toISOString() (UTC) un hábito marcado de
// noche en Venezuela (UTC-4) aparecía como pendiente y cortaba la racha.

export function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Fecha local de hace `days` días
export function daysAgoKey(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return localDateKey(d)
}

// Racha de días consecutivos registrados. Si hoy aún no se registró, la racha
// sigue viva contando desde ayer.
export function currentStreak(dates: Set<string>, maxDays = 365): number {
  let streak = 0
  for (let i = 0; i <= maxDays; i++) {
    if (dates.has(daysAgoKey(i))) streak++
    else if (i > 0) break
  }
  return streak
}

// Últimos `n` días (del más antiguo a hoy) indicando si se registraron
export function lastDays(dates: Set<string>, n: number): { key: string; date: Date; done: boolean }[] {
  const out: { key: string; date: Date; done: boolean }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = localDateKey(d)
    out.push({ key, date: d, done: dates.has(key) })
  }
  return out
}
