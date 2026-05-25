'use client'

import { BubbleMenu, type Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Strikethrough,
  Highlighter, AlignLeft, AlignCenter, AlignRight,
  Code
} from 'lucide-react'

interface Props { editor: Editor }

const btn = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '30px', height: '30px', borderRadius: '6px',
  background: active ? '#00F5FF22' : 'transparent',
  border: `1px solid ${active ? '#00F5FF44' : 'transparent'}`,
  color: active ? '#00F5FF' : '#94A3B8',
  cursor: 'pointer', transition: 'all 0.15s',
})

export default function BubbleMenuBar({ editor }: Props) {
  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150, placement: 'top' }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px',
        background: '#131829', border: '1px solid #1F2937',
        borderRadius: '10px', padding: '4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <button style={btn(editor.isActive('bold'))}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={13} />
        </button>
        <button style={btn(editor.isActive('italic'))}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={13} />
        </button>
        <button style={btn(editor.isActive('underline'))}
          onClick={() => editor.chain().focus().toggleUnderline?.().run()}>
          <Underline size={13} />
        </button>
        <button style={btn(editor.isActive('strike'))}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={13} />
        </button>
        <button style={btn(editor.isActive('highlight'))}
          onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter size={13} />
        </button>
        <button style={btn(editor.isActive('code'))}
          onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code size={13} />
        </button>

        <div style={{ width: '1px', height: '20px', background: '#1F2937', margin: '0 2px' }} />

        <button style={btn(editor.isActive({ textAlign: 'left' }))}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={13} />
        </button>
        <button style={btn(editor.isActive({ textAlign: 'center' }))}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={13} />
        </button>
        <button style={btn(editor.isActive({ textAlign: 'right' }))}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={13} />
        </button>
      </div>
    </BubbleMenu>
  )
}