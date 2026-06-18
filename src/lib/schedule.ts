import { ScheduleBlock } from '@/types/schedule'

// Nombres de los días según la convención JS getDay() (0=Domingo ... 6=Sábado)
export const DAY_NAMES       = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const DAY_SHORT       = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const DAY_INITIAL     = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

// Orden de presentación: empieza en Lunes y termina en Domingo
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

// Día de la semana de hoy (0=Domingo ... 6=Sábado) según hora local del usuario
export function localDayOfWeek(): number {
  return new Date().getDay()
}

// Hora actual en minutos desde medianoche (para ordenar / saber qué sigue)
export function nowMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

// 'HH:MM' -> minutos desde medianoche
export function timeToMinutes(time: string): number {
  const [h, m] = (time || '0:0').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Zona horaria del sistema (IANA), p.ej. 'America/Caracas'
export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Caracas'
  } catch {
    return 'America/Caracas'
  }
}

// Etiqueta legible de los días de un bloque: "L · X · V" o "Todos los días"
export function formatDays(days: number[]): string {
  if (!days || days.length === 0) return 'Sin días'
  if (days.length === 7) return 'Todos los días'
  // Lun-Vie
  const set = new Set(days)
  if (days.length === 5 && [1, 2, 3, 4, 5].every(d => set.has(d))) return 'Lun a Vie'
  if (days.length === 2 && set.has(0) && set.has(6)) return 'Fines de semana'
  return WEEK_ORDER.filter(d => set.has(d)).map(d => DAY_SHORT[d]).join(' · ')
}

// Ordena los bloques de un día por hora de inicio
export function sortByStart(blocks: ScheduleBlock[]): ScheduleBlock[] {
  return [...blocks].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
}

// Estado de un bloque respecto a la hora actual (solo tiene sentido si es hoy)
export type BlockStatus = 'now' | 'upcoming' | 'past'

export function blockStatus(block: ScheduleBlock): BlockStatus {
  const start = timeToMinutes(block.start_time)
  const end   = block.end_time ? timeToMinutes(block.end_time) : start + 60
  const now   = nowMinutes()
  if (now < start) return 'upcoming'
  if (now >= start && now < end) return 'now'
  return 'past'
}
