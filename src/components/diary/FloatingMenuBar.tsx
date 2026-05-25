'use client'

import { FloatingMenu, type Editor } from '@tiptap/react'
import {
  Type, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Quote,
  Minus, Image
} from 'lucide-react'

interface Props {
  editor: Editor
  onImageClick: () => void
}

const tools = [
  { icon: <Type size={14} />,         label: 'Texto',      action: (e: Editor) => e.chain().focus().setParagraph().run() },
  { icon: <Heading1 size={14} />,     label: 'Título 1',   action: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { icon: <Heading2 size={14} />,     label: 'Título 2',   action: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { icon: <Heading3 size={14} />,     label: 'Título 3',   action: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { icon: <List size={14} />,         label: 'Lista',       action: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { icon: <ListOrdered size={14} />,  label: 'Numerada',   action: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { icon: <CheckSquare size={14} />,  label: 'Checklist',  action: (e: Editor) => e.chain().focus().toggleTaskList().run() },
  { icon: <Quote size={14} />,        label: 'Cita',        action: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { icon: <Minus size={14} />,        label: 'Separador',  action: (e: Editor) => e.chain().focus().setHorizontalRule().run() },
]

const btnStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
  padding: '8px 10px', borderRadius: '8px',
  background: 'transparent', border: '1px solid transparent',
  color: '#94A3B8', cursor: 'pointer',
  fontSize: '10px', transition: 'all 0.15s',
  fontFamily: 'Inter, sans-serif',
}

export default function FloatingMenuBar({ editor, onImageClick }: Props) {
  return (
    <FloatingMenu
      editor={editor}
      tippyOptions={{ duration: 150, placement: 'bottom-start' }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px',
        background: '#131829', border: '1px solid #1F2937',
        borderRadius: '12px', padding: '6px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        flexWrap: 'wrap', maxWidth: '320px',
      }}>
        {tools.map(t => (
          <button
            key={t.label}
            style={btnStyle}
            onClick={() => t.action(editor)}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = '#00F5FF12'
              el.style.borderColor = '#00F5FF33'
              el.style.color = '#00F5FF'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'transparent'
              el.style.borderColor = 'transparent'
              el.style.color = '#94A3B8'
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}

        <button
          style={btnStyle}
          onClick={onImageClick}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = '#B026FF12'
            el.style.borderColor = '#B026FF33'
            el.style.color = '#B026FF'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = 'transparent'
            el.style.borderColor = 'transparent'
            el.style.color = '#94A3B8'
          }}
        >
          <Image size={14} />
          Imagen
        </button>
      </div>
    </FloatingMenu>
  )
}