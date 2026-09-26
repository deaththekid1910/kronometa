export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data    = encoder.encode(password + 'kronometa-diary-2025')
  const hash    = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const pwHash = await hashPassword(password)
  return pwHash === hash
}

// Mantenemos Block por compatibilidad con DiaryEntryCard
export interface Block {
  id: string
  type: string
  content: string
  checked?: boolean
  items?: string[]
  level?: 1 | 2 | 3
}

export interface DiaryEntry {
  id: string
  user_id: string
  title: string
  content: string
  mood: string
  date: string
  time?: string   // HH:MM — columna separada en la BD
  timezone: string
  created_at: string
  updated_at: string
}

export const MOODS = [
  { key: 'amazing',  emoji: '🚀', label: 'Increíble',  color: '#00FF88' },
  { key: 'good',     emoji: '😊', label: 'Bien',        color: '#00F5FF' },
  { key: 'neutral',  emoji: '😐', label: 'Normal',      color: '#94A3B8' },
  { key: 'tired',    emoji: '😴', label: 'Cansado',     color: '#FFB800' },
  { key: 'stressed', emoji: '😤', label: 'Estresado',   color: '#FF3860' },
  { key: 'sad',      emoji: '😔', label: 'Triste',      color: '#B026FF' },
]

// Texto plano de una entrada (sin etiquetas HTML ni imágenes base64).
// Se usa para la búsqueda y la vista previa: así buscar "img" o "strong" no
// devuelve todas las entradas por coincidir con el marcado interno.
export function diaryPlainText(html: unknown): string {
  if (!html) return ''
  const str = typeof html === 'string' ? html : JSON.stringify(html)
  return str
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// Fecha 'YYYY-MM-DD' de una entrada (acepta el formato legacy con 'T')
export function entryDay(entry: Pick<DiaryEntry, 'date'>): string {
  return entry.date.includes('T') ? entry.date.split('T')[0] : entry.date
}

// Hora 'HH:MM' de una entrada (campo time o legacy dentro de date)
export function entryTime(entry: Pick<DiaryEntry, 'date' | 'time'>): string | null {
  if (entry.time) return entry.time.slice(0, 5)
  return entry.date.includes('T') ? entry.date.split('T')[1].slice(0, 5) : null
}

// Reduce una foto a un tamaño razonable antes de incrustarla en la entrada.
// Una foto de móvil (4-8 MB) queda en ~200-500 KB sin pérdida visible, lo que
// hace que el diario cargue mucho más rápido. Devuelve null si no se puede.
export async function compressImage(file: File, maxSide = 1600, quality = 0.85): Promise<string | null> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return null
  try {
    const bitmap = await createImageBitmap(file)
    const scale  = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width  = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    // PNG (posible transparencia) se intenta mantener; si pesa demasiado
    // (capturas de pantalla grandes) se pasa a JPEG como el resto.
    if (file.type === 'image/png') {
      const png = canvas.toDataURL('image/png')
      if (png.length < 1.5 * 1024 * 1024) return png
    }
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return null
  }
}
