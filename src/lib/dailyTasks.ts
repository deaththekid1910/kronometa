// Fecha "de hoy" según la zona horaria local del usuario (no UTC).
// Las tareas diarias se agrupan por este valor.
export function localToday(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Zona horaria del sistema (IANA), p.ej. 'America/Caracas'
export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Caracas'
  } catch {
    return 'America/Caracas'
  }
}

// Etiqueta legible de una fecha 'YYYY-MM-DD' (atrasos en la sección incompletas)
export function formatTaskDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('es-VE', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}
