'use client'

import { useEffect, useRef, useState } from 'react'
import { type Editor } from '@tiptap/react'
import {
  Bold, Italic, Strikethrough,
  Highlighter, AlignLeft, AlignCenter, AlignRight, Code
} from 'lucide-react'

interface Props { editor: Editor }

export default function BubbleMenuBar({ editor }: Props) {
  const [visible, setVisible] = useState(false)
  const [pos,     setPos]     = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function update() {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
        setVisible(false)
        return
      }
      const range = selection.getRangeAt(0)
      const rect  = range.getBoundingClientRect()
      if (rect.width === 0) { setVisible(false); return }

      const menuW = 300
      let left = rect.left + rect.width / 2 - menuW / 2
      if (left < 8) left = 8
      if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8

      setPos({ top: rect.top - 52 + window.scrollY, left })
      setVisible(true)
    }

    document.addEventListener('selectionchange', update)
    return () => document.removeEventListener('selectionchange', update)
  }, [])

  if (!visible) return null

  const btn = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '30px', height: '30px', borderRadius: '6px',
    background: active ? '#00F5FF22' : 'transparent',
    border: `1px solid ${active ? '#00F5FF44' : 'transparent'}`,
    color: active ? '#00F5FF' : '#94A3B8',
    cursor: 'pointer', transition: 'all 0.15s',
    flexShrink: 0,
  })

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: '2px',
        background: '#131829', border: '1px solid #1F2937',
        borderRadius: '10px', padding: '4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        animation: 'bubble-appear 0.15s ease',
      }}
    >
      <style>{`@keyframes bubble-appear{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <button style={btn(editor.isActive('bold'))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}>
        <Bold size={13} />
      </button>
      <button style={btn(editor.isActive('italic'))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}>
        <Italic size={13} />
      </button>
      <button style={btn(editor.isActive('strike'))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}>
        <Strikethrough size={13} />
      </button>
      <button style={btn(editor.isActive('highlight'))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHighlight().run() }}>
        <Highlighter size={13} />
      </button>
      <button style={btn(editor.isActive('code'))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleCode().run() }}>
        <Code size={13} />
      </button>

      <div style={{ width: '1px', height: '20px', background: '#1F2937', margin: '0 2px' }} />

      <button style={btn(editor.isActive({ textAlign: 'left' }))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run() }}>
        <AlignLeft size={13} />
      </button>
      <button style={btn(editor.isActive({ textAlign: 'center' }))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run() }}>
        <AlignCenter size={13} />
      </button>
      <button style={btn(editor.isActive({ textAlign: 'right' }))}
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run() }}>
        <AlignRight size={13} />
      </button>
    </div>
  )
}