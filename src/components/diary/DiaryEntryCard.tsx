'use client'

import { DiaryEntry, MOODS, Block } from '@/lib/diary'
import { Calendar, Edit2, Trash2 } from 'lucide-react'

interface Props {
  entry: DiaryEntry
  onEdit: () => void
  onDelete: () => void
}

function BlockPreview({ block }: { block: Block }) {
  switch (block.type) {
    case 'paragraph':
      return <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 6px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{block.content}</p>
    case 'heading':
      return <div style={{ fontSize: block.level === 1 ? '16px' : '14px', fontWeight: 700, color: '#94A3B8', margin: '0 0 4px' }}>{block.content}</div>
    case 'quote':
      return <div style={{ fontSize: '13px', color: '#B026FF', fontStyle: 'italic', borderLeft: '2px solid #B026FF', paddingLeft: '10px', margin: '0 0 6px' }}>{block.content}</div>
    case 'list':
      return <div style={{ fontSize: '12px', color: '#64748B' }}>• {(block.items || []).slice(0, 3).join(' • ')}{(block.items || []).length > 3 ? '...' : ''}</div>
    case 'image':
      return block.content ? <img src={block.content} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }} onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'} /> : null
    default:
      return null
  }
}

export default function DiaryEntryCard({ entry, onEdit, onDelete }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const mood  = MOODS.find(m => m.key === entry.mood) || MOODS[2]
  const date  = new Date(entry.date + 'T12:00:00')
  const label = date.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{
      background: '#131829', border: '1px solid #1F2937',
      borderRadius: '14px', overflow: 'hidden',
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#374151'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#1F2937'}
    >
      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid #1F2937',
        background: '#0d1120',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '20px' }}>{mood.emoji}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#374151' }}>
              <Calendar size={10} />
              <span style={{ textTransform: 'capitalize' }}>{label}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button onClick={onEdit} style={{
            width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
            background: '#00F5FF12', border: '1px solid #00F5FF22',
            color: '#00F5FF', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Edit2 size={13} />
          </button>
          <button onClick={() => setShowConfirm(true)} style={{
            width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
            background: '#FF386012', border: '1px solid #FF386022',
            color: '#FF3860', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* PREVIEW */}
      <div style={{ padding: '14px 16px' }}>
        {entry.content.slice(0, 3).map(b => <BlockPreview key={b.id} block={b} />)}
        {entry.content.length > 3 && (
          <div style={{ fontSize: '12px', color: '#374151' }}>+{entry.content.length - 3} bloques más...</div>
        )}
      </div>

      {/* MOOD BADGE */}
      <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
          background: '#FF386008', display: 'flex', alignItems: 'center',
          gap: '10px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '12px', color: '#94A3B8', flex: 1 }}>¿Eliminar esta entrada?</span>
          <button onClick={onDelete} style={{
            padding: '5px 14px', borderRadius: '6px',
            background: '#FF3860', border: 'none',
            color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
          }}>Sí</button>
          <button onClick={() => setShowConfirm(false)} style={{
            padding: '5px 14px', borderRadius: '6px',
            background: 'transparent', border: '1px solid #1F2937',
            color: '#64748B', fontSize: '12px', cursor: 'pointer',
          }}>No</button>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'