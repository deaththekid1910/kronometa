'use client'

import { useState } from 'react'
import { DiaryEntry, MOODS } from '@/lib/diary'
import { Calendar, Edit2, Trash2 } from 'lucide-react'

interface Props {
  entry: DiaryEntry
  onEdit: () => void
  onDelete: () => void
}

function stripHtml(html: unknown): string {
  if (!html) return ''
  const str = typeof html === 'string' ? html : JSON.stringify(html)
  return str
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

function getPreviewImage(html: unknown): string | null {
  if (!html || typeof html !== 'string') return null
  const match = html.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : null
}

export default function DiaryEntryCard({ entry, onEdit, onDelete }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)

  const mood      = MOODS.find(m => m.key === entry.mood) || MOODS[2]
  const dateStr   = entry.date.includes('T') ? entry.date.split('T')[0] : entry.date
  // Preferir campo time separado; si no, intentar extraerlo del date (legacy)
  const timeStr   = entry.time
    || (entry.date.includes('T') ? entry.date.split('T')[1].slice(0, 5) : null)
  const date      = new Date(dateStr + 'T12:00:00')
  const label     = date.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })
  const preview   = stripHtml(entry.content)
  const image     = getPreviewImage(entry.content)

  return (
    <div style={{
      background: '#131829', border: '1px solid #1F2937',
      borderRadius: '14px', overflow: 'hidden',
      transition: 'all 0.2s', cursor: 'default',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#374151'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#1F2937'}
    >
      {/* IMAGEN PREVIEW */}
      {image && (
        <div style={{ height: '120px', overflow: 'hidden' }}>
          <img
            src={image} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'}
          />
        </div>
      )}

      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: '10px',
        padding: '14px 16px', borderBottom: '1px solid #1F2937',
        background: '#0d1120',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>{mood.emoji}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '14px', fontWeight: 600, color: '#F1F5F9',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              marginBottom: '3px',
            }}>
              {entry.title}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', color: '#374151', textTransform: 'capitalize',
            }}>
              <Calendar size={10} />
              {label}
              {timeStr && (
                <span style={{ textTransform: 'none', marginLeft: '2px' }}>· {timeStr}</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={onEdit}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: '#00F5FF12', border: '1px solid #00F5FF22',
              color: '#00F5FF', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: '#FF386012', border: '1px solid #FF386022',
              color: '#FF3860', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* PREVIEW DEL CONTENIDO */}
      {preview && (
        <div style={{ padding: '12px 16px' }}>
          <p style={{
            fontSize: '13px', color: '#64748B',
            lineHeight: 1.6, margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {preview}
          </p>
        </div>
      )}

      {/* MOOD BADGE */}
      <div style={{ padding: '0 16px 14px' }}>
        <span style={{
          fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
          background: mood.color + '15', border: `1px solid ${mood.color}30`,
          color: mood.color,
        }}>
          {mood.emoji} {mood.label}
        </span>
      </div>

      {/* CONFIRM DELETE */}
      {showConfirm && (
        <div style={{
          padding: '12px 16px', borderTop: '1px solid #FF386022',
          background: '#FF386008',
          display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '12px', color: '#94A3B8', flex: 1 }}>
            ¿Eliminar esta entrada?
          </span>
          <button
            onClick={onDelete}
            style={{
              padding: '5px 14px', borderRadius: '6px',
              background: '#FF3860', border: 'none',
              color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Sí
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            style={{
              padding: '5px 14px', borderRadius: '6px',
              background: 'transparent', border: '1px solid #1F2937',
              color: '#64748B', fontSize: '12px', cursor: 'pointer',
            }}
          >
            No
          </button>
        </div>
      )}
    </div>
  )
}