'use client'

import { useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExt from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CharacterCount from '@tiptap/extension-character-count'
import { DiaryEntry, MOODS } from '@/lib/diary'
import { createClient } from '@/lib/supabase'
import BubbleMenuBar from './BubbleMenuBar'
import FloatingMenuBar from './FloatingMenuBar'
import { Save, X, FileImage } from 'lucide-react'

interface Props {
  entry?: DiaryEntry
  date: string
  timezone: string
  userId: string
  onSave: (entry: DiaryEntry) => void
  onCancel: () => void
}

export default function DiaryEditor({ entry, date, timezone, userId, onSave, onCancel }: Props) {
  const [title,     setTitle]     = useState(entry?.title || '')
  const [mood,      setMood]      = useState(entry?.mood || 'neutral')
  const [loading,   setLoading]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  const fileRef                   = useRef<HTMLInputElement>(null)
  const autoSaveTimer             = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExt.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: 'Escribe aquí... (selecciona texto para formato · línea vacía para menú de bloques)' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
    ],
    content: entry?.content || '',
    editorProps: {
      attributes: {
        style: [
          'outline: none',
          'min-height: 400px',
          'padding: 0',
          'font-family: Inter, sans-serif',
          'font-size: 15px',
          'line-height: 1.8',
          'color: #CBD5E1',
        ].join(';'),
      },
    },
    onUpdate: () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => {
        handleAutoSave()
      }, 3000)
    },
  })

  async function handleAutoSave() {
    if (!editor || !title.trim() || !entry) return
    const supabase = createClient()
    await supabase
      .from('diary_entries')
      .update({ content: editor.getHTML(), updated_at: new Date().toISOString() })
      .eq('id', entry.id)
    setAutoSaved(true)
    setTimeout(() => setAutoSaved(false), 2000)
  }

  async function handleImageUpload(file: File) {
    if (!file || !editor) return
    setUploading(true)

    if (file.size < 2 * 1024 * 1024) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const src = e.target?.result as string
        editor.chain().focus().setImage({ src }).run()
        setUploading(false)
      }
      reader.readAsDataURL(file)
      return
    }

    try {
      const supabase = createClient()
      const ext      = file.name.split('.').pop()
      const filename = `${userId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('diary-images')
        .upload(filename, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      const { data: url } = supabase.storage
        .from('diary-images')
        .getPublicUrl(filename)

      editor.chain().focus().setImage({ src: url.publicUrl }).run()
    } catch {
      const reader = new FileReader()
      reader.onload = (e) => {
        editor.chain().focus().setImage({ src: e.target?.result as string }).run()
      }
      reader.readAsDataURL(file)
    }
    setUploading(false)
  }

  async function handleSave() {
    if (!editor || !title.trim()) return
    setLoading(true)
    const supabase = createClient()
    const payload  = {
      user_id:  userId,
      title:    title.trim(),
      content:  editor.getHTML(),
      mood,
      date,
      timezone,
    }

    let saved: DiaryEntry | null = null

    if (entry) {
      const { data } = await supabase
        .from('diary_entries')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', entry.id)
        .select()
        .single()
      saved = data
    } else {
      const { data } = await supabase
        .from('diary_entries')
        .insert(payload)
        .select()
        .single()
      saved = data
    }

    if (saved) onSave(saved)
    setLoading(false)
  }

  const currentMood = MOODS.find(m => m.key === mood) || MOODS[2]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
      background: '#0A0E1A',
    }}>

      {/* INPUT IMAGEN OCULTO */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleImageUpload(file)
          e.target.value = ''
        }}
      />

      {/* TOPBAR */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', borderBottom: '1px solid #1F2937',
        flexShrink: 0, flexWrap: 'wrap', gap: '8px',
        background: '#0d1120',
      }}>
        {/* MOODS */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {MOODS.map(m => (
            <button key={m.key} onClick={() => setMood(m.key)} style={{
              padding: '4px 10px', borderRadius: '20px',
              border: `1px solid ${mood === m.key ? m.color + '66' : '#1F2937'}`,
              background: mood === m.key ? m.color + '15' : 'transparent',
              color: mood === m.key ? m.color : '#374151',
              fontSize: '12px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              {m.emoji}
              <span className="mood-label"> {m.label}</span>
            </button>
          ))}
        </div>

        {/* ACCIONES */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {autoSaved && (
            <span style={{ fontSize: '11px', color: '#00FF88', fontFamily: 'JetBrains Mono, monospace' }}>
              ✓ guardado
            </span>
          )}
          {uploading && (
            <span style={{ fontSize: '11px', color: '#FFB800' }}>subiendo...</span>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 12px', borderRadius: '8px',
              background: '#B026FF15', border: '1px solid #B026FF33',
              color: '#B026FF', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <FileImage size={14} />
            <span className="img-label">Imagen</span>
          </button>
          <button
            onClick={onCancel}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'transparent', border: '1px solid #1F2937',
              color: '#64748B', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !title.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '8px',
              background: '#00F5FF', border: 'none',
              color: '#0A0E1A', fontSize: '13px', fontWeight: 700,
              cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
              opacity: !title.trim() ? 0.5 : 1,
              boxShadow: '0 0 12px #00F5FF44',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Save size={14} />
            {loading ? '...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ÁREA DE ESCRITURA */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '28px clamp(16px, 8vw, 120px)',
        display: 'flex', flexDirection: 'column', gap: '14px',
        position: 'relative',
      }}>

        {/* FECHA */}
        <div style={{ fontSize: '12px', color: '#374151', textTransform: 'capitalize' }}>
          {new Date(date + 'T12:00:00').toLocaleDateString('es-VE', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
          {' · '}{currentMood.emoji} {currentMood.label}
        </div>

        {/* TÍTULO */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título de la entrada..."
          style={{
            width: '100%', background: 'transparent',
            border: 'none', outline: 'none',
            fontSize: 'clamp(22px, 3vw, 36px)',
            fontWeight: 700, color: '#F1F5F9',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.5px',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ height: '1px', background: '#1F2937' }} />

        <div style={{ fontSize: '11px', color: '#1F2937', fontStyle: 'italic' }}>
          Selecciona texto → opciones de formato · Línea vacía → menú de bloques
        </div>

        {/* MENÚS FLOTANTES */}
        {editor && (
          <>
            <BubbleMenuBar editor={editor} />
            <FloatingMenuBar editor={editor} onImageClick={() => fileRef.current?.click()} />
          </>
        )}

        {/* EDITOR */}
        <div style={{ flex: 1, minHeight: '400px' }}>
          <EditorContent editor={editor} />
        </div>

        {/* CONTEO */}
        {editor && (
          <div style={{
            fontSize: '11px', color: '#374151',
            textAlign: 'right', paddingTop: '8px',
            borderTop: '1px solid #1F2937',
          }}>
            {editor.storage.characterCount.words()} palabras
            {' · '}
            {editor.storage.characterCount.characters()} caracteres
          </div>
        )}
      </div>

      <style>{`
        .ProseMirror { outline: none; min-height: 400px; }
        .ProseMirror p { margin: 0 0 12px; }
        .ProseMirror p:last-child { margin-bottom: 0; }
        .ProseMirror h1 { font-size: 26px; font-weight: 700; color: #F1F5F9; margin: 20px 0 10px; letter-spacing: -0.5px; }
        .ProseMirror h2 { font-size: 20px; font-weight: 600; color: #E2E8F0; margin: 16px 0 8px; }
        .ProseMirror h3 { font-size: 16px; font-weight: 600; color: #CBD5E1; margin: 14px 0 6px; }
        .ProseMirror blockquote {
          border-left: 3px solid #B026FF;
          margin: 12px 0; padding: 4px 0 4px 16px;
          color: #B026FF; font-style: italic;
        }
        .ProseMirror ul { padding-left: 20px; margin: 8px 0; }
        .ProseMirror ol { padding-left: 20px; margin: 8px 0; }
        .ProseMirror li { margin-bottom: 4px; color: #CBD5E1; }
        .ProseMirror li::marker { color: #00F5FF; }
        .ProseMirror ul[data-type="taskList"] { padding-left: 0; list-style: none; }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex; align-items: flex-start; gap: 10px; margin-bottom: 6px;
        }
        .ProseMirror ul[data-type="taskList"] li > label { margin-top: 3px; flex-shrink: 0; }
        .ProseMirror ul[data-type="taskList"] li input[type="checkbox"] {
          accent-color: #00F5FF; width: 16px; height: 16px; cursor: pointer;
        }
        .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
          text-decoration: line-through; color: #374151;
        }
        .ProseMirror img {
          max-width: 100%; border-radius: 10px;
          margin: 16px 0; border: 1px solid #1F2937;
          max-height: 480px; object-fit: contain; display: block;
        }
        .ProseMirror hr { border: none; border-top: 1px solid #1F2937; margin: 24px 0; }
        .ProseMirror code {
          background: #0d1120; border: 1px solid #1F2937;
          border-radius: 4px; padding: 2px 6px;
          font-family: JetBrains Mono, monospace; font-size: 13px; color: #00F5FF;
        }
        .ProseMirror pre {
          background: #0d1120; border: 1px solid #1F2937;
          border-radius: 8px; padding: 14px; margin: 12px 0; overflow-x: auto;
        }
        .ProseMirror pre code { background: none; border: none; padding: 0; }
        .ProseMirror mark {
          background: #FFB80033; color: #FFB800;
          border-radius: 3px; padding: 0 2px;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left; color: #374151;
          pointer-events: none; height: 0; font-style: italic;
        }
        .ProseMirror strong { color: #F1F5F9; font-weight: 600; }
        .ProseMirror em { color: #CBD5E1; }
        .ProseMirror s { color: #64748B; }
        @media(max-width:600px){
          .mood-label { display: none; }
          .img-label  { display: none; }
        }
      `}</style>
    </div>
  )
}