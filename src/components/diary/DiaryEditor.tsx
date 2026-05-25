'use client'

import { useState, useRef } from 'react'
import { Block, BlockType, DiaryEntry, MOODS, generateId } from '@/lib/diary'
import DiaryToolbar from './DiaryToolbar'
import { createClient } from '@/lib/supabase'
import { Save, Trash2, GripVertical, X, Plus } from 'lucide-react'

interface Props {
  entry?: DiaryEntry
  date: string
  timezone: string
  userId: string
  onSave: (entry: DiaryEntry) => void
  onCancel: () => void
}

export default function DiaryEditor({ entry, date, timezone, userId, onSave, onCancel }: Props) {
  const [title,   setTitle]   = useState(entry?.title || '')
  const [blocks,  setBlocks]  = useState<Block[]>(entry?.content || [{ id: generateId(), type: 'paragraph', content: '' }])
  const [mood,    setMood]    = useState(entry?.mood || 'neutral')
  const [loading, setLoading] = useState(false)

  function addBlock(block: Block) {
    setBlocks(prev => [...prev, block])
  }

  function updateBlock(id: string, updates: Partial<Block>) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  function removeBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  function updateListItem(blockId: string, idx: number, value: string) {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      const items = [...(b.items || [])]
      items[idx] = value
      return { ...b, items }
    }))
  }

  function addListItem(blockId: string) {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      return { ...b, items: [...(b.items || []), ''] }
    }))
  }

  function removeListItem(blockId: string, idx: number) {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      const items = (b.items || []).filter((_, i) => i !== idx)
      return { ...b, items: items.length ? items : [''] }
    }))
  }

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)
    const supabase = createClient()

    const payload = {
      user_id:  userId,
      title:    title.trim(),
      content:  blocks,
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
        .select().single()
      saved = data
    } else {
      const { data } = await supabase
        .from('diary_entries')
        .insert(payload)
        .select().single()
      saved = data
    }

    if (saved) onSave(saved)
    setLoading(false)
  }

  const inputBase: React.CSSProperties = {
    width: '100%', background: 'transparent',
    border: 'none', outline: 'none',
    color: '#F1F5F9', fontFamily: 'Inter, sans-serif',
    resize: 'none', boxSizing: 'border-box',
  }

  function renderBlock(block: Block) {
    switch (block.type) {

      case 'paragraph':
        return (
          <textarea
            value={block.content}
            onChange={e => updateBlock(block.id, { content: e.target.value })}
            placeholder="Escribe algo..."
            rows={3}
            style={{ ...inputBase, fontSize: '14px', lineHeight: 1.7, color: '#CBD5E1' }}
          />
        )

      case 'heading':
        return (
          <input
            value={block.content}
            onChange={e => updateBlock(block.id, { content: e.target.value })}
            placeholder={block.level === 1 ? 'Título principal' : 'Subtítulo'}
            style={{
              ...inputBase,
              fontSize: block.level === 1 ? '22px' : '17px',
              fontWeight: 700,
              color: '#F1F5F9',
              letterSpacing: '-0.5px',
            }}
          />
        )

      case 'quote':
        return (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '3px', background: '#B026FF', borderRadius: '3px', flexShrink: 0 }} />
            <textarea
              value={block.content}
              onChange={e => updateBlock(block.id, { content: e.target.value })}
              placeholder="Escribe una cita o pensamiento..."
              rows={2}
              style={{
                ...inputBase, fontSize: '15px',
                fontStyle: 'italic', color: '#B026FF',
                lineHeight: 1.6,
              }}
            />
          </div>
        )

      case 'list':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(block.items || ['']).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00F5FF', flexShrink: 0 }} />
                <input
                  value={item}
                  onChange={e => updateListItem(block.id, i, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addListItem(block.id) }
                    if (e.key === 'Backspace' && !item && i > 0) removeListItem(block.id, i)
                  }}
                  placeholder={`Elemento ${i + 1}`}
                  style={{ ...inputBase, fontSize: '14px', color: '#CBD5E1', flex: 1 }}
                />
                <button onClick={() => removeListItem(block.id, i)} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', display: 'flex', padding: '2px' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
            <button onClick={() => addListItem(block.id)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', color: '#374151',
              cursor: 'pointer', fontSize: '12px', width: 'fit-content',
              fontFamily: 'Inter, sans-serif',
            }}>
              <Plus size={12} /> Agregar elemento
            </button>
          </div>
        )

      case 'checklist':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(block.items || ['']).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  style={{ accentColor: '#00F5FF', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }}
                />
                <input
                  value={item}
                  onChange={e => updateListItem(block.id, i, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addListItem(block.id) }
                    if (e.key === 'Backspace' && !item && i > 0) removeListItem(block.id, i)
                  }}
                  placeholder={`Tarea ${i + 1}`}
                  style={{ ...inputBase, fontSize: '14px', color: '#CBD5E1', flex: 1 }}
                />
                <button onClick={() => removeListItem(block.id, i)} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', display: 'flex', padding: '2px' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
            <button onClick={() => addListItem(block.id)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', color: '#374151',
              cursor: 'pointer', fontSize: '12px', width: 'fit-content',
              fontFamily: 'Inter, sans-serif',
            }}>
              <Plus size={12} /> Agregar tarea
            </button>
          </div>
        )

      case 'image':
        return (
          <div>
            <input
              value={block.content}
              onChange={e => updateBlock(block.id, { content: e.target.value })}
              placeholder="Pega la URL de una imagen..."
              style={{ ...inputBase, fontSize: '13px', color: '#64748B', marginBottom: block.content ? '10px' : '0' }}
            />
            {block.content && (
              <img
                src={block.content}
                alt="Imagen del diario"
                style={{
                  width: '100%', maxHeight: '300px',
                  objectFit: 'cover', borderRadius: '10px',
                  border: '1px solid #1F2937',
                }}
                onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'}
              />
            )}
          </div>
        )

      case 'divider':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #1F2937, transparent)' }} />
            <span style={{ fontSize: '12px', color: '#374151' }}>✦</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #1F2937, transparent)' }} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* TÍTULO */}
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título de la entrada..."
        style={{
          width: '100%', background: 'transparent', border: 'none',
          outline: 'none', fontSize: '24px', fontWeight: 700,
          color: '#F1F5F9', fontFamily: 'Inter, sans-serif',
          letterSpacing: '-0.5px', boxSizing: 'border-box',
        }}
      />

      {/* MOOD */}
      <div>
        <div style={{ fontSize: '11px', color: '#64748B', letterSpacing: '1px', marginBottom: '8px' }}>¿CÓMO TE SIENTES HOY?</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {MOODS.map(m => (
            <button
              key={m.key}
              onClick={() => setMood(m.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '20px',
                border: `1px solid ${mood === m.key ? m.color + '66' : '#1F2937'}`,
                background: mood === m.key ? m.color + '15' : 'transparent',
                color: mood === m.key ? m.color : '#64748B',
                fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              <span>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: '1px', background: '#1F2937' }} />

      {/* TOOLBAR */}
      <DiaryToolbar onAdd={addBlock} />

      {/* BLOQUES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '200px' }}>
        {blocks.map((block, i) => (
          <div
            key={block.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px',
              padding: '12px 14px',
              background: '#0d1120', border: '1px solid #1F2937',
              borderRadius: '10px', transition: 'border-color 0.15s',
              position: 'relative',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#374151'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#1F2937'}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {renderBlock(block)}
            </div>
            {block.type !== 'divider' && (
              <button
                onClick={() => removeBlock(block.id)}
                style={{
                  background: 'none', border: 'none',
                  color: '#374151', cursor: 'pointer',
                  padding: '2px', display: 'flex', flexShrink: 0,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#FF3860'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#374151'}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ACCIONES */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
        <button onClick={onCancel} style={{
          padding: '10px 20px', borderRadius: '8px',
          background: 'transparent', border: '1px solid #1F2937',
          color: '#64748B', fontSize: '13px', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}>
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !title.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '8px',
            background: '#00F5FF', border: 'none',
            color: '#0A0E1A', fontSize: '13px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            opacity: !title.trim() ? 0.5 : 1,
            boxShadow: '0 0 16px #00F5FF44',
          }}
        >
          <Save size={15} />
          {loading ? 'Guardando...' : 'Guardar entrada'}
        </button>
      </div>
    </div>
  )
}