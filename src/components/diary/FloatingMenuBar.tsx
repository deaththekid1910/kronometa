'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { type Editor } from '@tiptap/react'
import {
  Type, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Quote, Minus, Image
} from 'lucide-react'

interface Props {
  editor: Editor
  onImageClick: () => void
}

const tools = [
  { icon: <Type size={13} />,        label: 'Texto',     action: (e: Editor) => e.chain().focus().setParagraph().run() },
  { icon: <Heading1 size={13} />,    label: 'Título 1',  action: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { icon: <Heading2 size={13} />,    label: 'Título 2',  action: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { icon: <Heading3 size={13} />,    label: 'Título 3',  action: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { icon: <List size={13} />,        label: 'Lista',      action: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { icon: <ListOrdered size={13} />, label: 'Numerada',  action: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { icon: <CheckSquare size={13} />, label: 'Check',     action: (e: Editor) => e.chain().focus().toggleTaskList().run() },
  { icon: <Quote size={13} />,       label: 'Cita',       action: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { icon: <Minus size={13} />,       label: 'Línea',     action: (e: Editor) => e.chain().focus().setHorizontalRule().run() },
]

export default function FloatingMenuBar({ editor, onImageClick }: Props) {
  const [visible, setVisible] = useState(false)
  const [pos,     setPos]     = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)

  const checkEmpty = useCallback(() => {
    if (!editor) return
    const { state } = editor
    const { selection } = state
    const { $anchor } = selection
    const node = $anchor.parent

    const isEmpty   = node.textContent === ''
    const isDefault = node.type.name === 'paragraph'

    if (isEmpty && isDefault) {
      try {
        const domNode = editor.view.domAtPos($anchor.pos)?.node as HTMLElement
        if (domNode) {
          const rect = (domNode.nodeType === 1 ? domNode : domNode.parentElement)?.getBoundingClientRect()
          if (rect) {
            setPos({ top: rect.top + window.scrollY - 4, left: rect.left })
            setVisible(true)
            return
          }
        }
      } catch {}
    }
    setVisible(false)
  }, [editor])

  useEffect(() => {
    if (!editor) return
    editor.on('selectionUpdate', checkEmpty)
    editor.on('focus', checkEmpty)
    editor.on('blur', () => setTimeout(() => setVisible(false), 200))
    return () => {
      editor.off('selectionUpdate', checkEmpty)
      editor.off('focus', checkEmpty)
    }
  }, [editor, checkEmpty])

  if (!visible) return null

  const btnStyle = (color = '#00F5FF'): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
    padding: '7px 8px', borderRadius: '8px',
    background: 'transparent', border: '1px solid transparent',
    color: '#64748B', cursor: 'pointer',
    fontSize: '10px', transition: 'all 0.15s',
    fontFamily: 'Inter, sans-serif', flexShrink: 0,
  })

  function handleMouseEnter(e: React.MouseEvent, color = '#00F5FF') {
    const el = e.currentTarget as HTMLButtonElement
    el.style.background = color + '15'
    el.style.borderColor = color + '33'
    el.style.color = color
  }

  function handleMouseLeave(e: React.MouseEvent) {
    const el = e.currentTarget as HTMLButtonElement
    el.style.background = 'transparent'
    el.style.borderColor = 'transparent'
    el.style.color = '#64748B'
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        zIndex: 999,
        display: 'flex', alignItems: 'center', gap: '2px',
        background: '#131829', border: '1px solid #1F2937',
        borderRadius: '12px', padding: '4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        flexWrap: 'wrap', maxWidth: '340px',
        animation: 'float-appear 0.15s ease',
      }}
    >
      <style>{`@keyframes float-appear{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {tools.map(t => (
        <button
          key={t.label}
          style={btnStyle()}
          onMouseDown={e => { e.preventDefault(); t.action(editor) }}
          onMouseEnter={e => handleMouseEnter(e)}
          onMouseLeave={handleMouseLeave}
        >
          {t.icon}
          {t.label}
        </button>
      ))}

      <button
        style={btnStyle('#B026FF')}
        onMouseDown={e => { e.preventDefault(); onImageClick() }}
        onMouseEnter={e => handleMouseEnter(e, '#B026FF')}
        onMouseLeave={handleMouseLeave}
      >
        <Image size={13} />
        Imagen
      </button>
    </div>
  )
}