// Hash simple del PIN usando Web Crypto API
export async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data    = encoder.encode(pin + 'kronometa-salt-2025')
  const hash    = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  const pinHash = await hashPIN(pin)
  return pinHash === hash
}

// Tipos de bloques del editor
export type BlockType = 'paragraph' | 'heading' | 'quote' | 'list' | 'image' | 'divider' | 'checklist'

export interface Block {
  id: string
  type: BlockType
  content: string
  checked?: boolean
  items?: string[]
  level?: 1 | 2 | 3
}

export interface DiaryEntry {
  id: string
  user_id: string
  title: string
  content: Block[]
  mood: string
  date: string
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

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}