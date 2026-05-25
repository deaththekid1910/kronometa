'use client'

import { Block, BlockType, generateId } from '@/lib/diary'
import {
  Type, Quote, List, Image, Minus,
  CheckSquare, Heading1, Heading2
} from 'lucide-react'

interface Props {
  onAdd: (block: Block) => void
}

const tools: { icon: React.ReactNode; label: string; type: BlockType; extra?: Partial<Block> }[] = [
  { icon: <Type size={16} />,      label: 'Texto',      type: 'paragraph' },
  { icon: <Heading1 size={16} />,  label: 'Título',     type: 'heading',   extra: { level: 1 } },
  { icon: <Heading2 size={16} />,  label: 'Subtítulo',  type: 'heading',   extra: { level: 2 } },
  { icon: <Quote size={16} />,     label: 'Cita',       type: 'quote' },
  { icon: <List size={16} />,      label: 'Lista',      type: 'list',      extra: { items: [''] } },
  { icon: <CheckSquare size={16} />,label: 'Checklist', type: 'checklist', extra: { items: [''], checked: false } },
  { icon: <Image size={16} />,     label: 'Imagen URL', type: 'image' },
  { icon: <Minus size={16} />,     label: 'Separador',  type: 'divider' },
]

export default function DiaryToolbar({ onAdd }: Props) {
  return (
    <div style={{
      display: 'flex', gap: '6px', flexWrap: 'wrap',
      padding: '12px', background: '#0d1120',
      border: '1px solid #1F2937', borderRadius: '12px',
      marginBottom: '16px',
    }}>
      {tools.map(t => (
        <button
          key={t.label}
          onClick={() => onAdd({
            id: generateId(),
            type: t.type,
            content: '',
            ...t.extra,
          })}
          title={t.label}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 12px', borderRadius: '8px',
            background: 'transparent', border: '1px solid #1F2937',
            color: '#94A3B8', fontSize: '12px', cursor: 'pointer',
            transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#00F5FF12'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#00F5FF44'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#00F5FF'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#1F2937'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#94A3B8'
          }}
        >
          {t.icon}
          <span className="toolbar-label">{t.label}</span>
        </button>
      ))}
      <style>{`@media(max-width:600px){.toolbar-label{display:none}}`}</style>
    </div>
  )
}