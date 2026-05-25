'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { DiaryEntry } from '@/lib/diary'
import DiaryLock from '@/components/diary/DiaryLock'
import DiaryEditor from '@/components/diary/DiaryEditor'
import DiaryEntryCard from '@/components/diary/DiaryEntryCard'
import { BookOpen, Plus, Lock, Search } from 'lucide-react'

export default function DiaryPage() {
  const [unlocked,  setUnlocked]  = useState(false)
  const [hasPin,    setHasPin]    = useState(false)
  const [pinHash,   setPinHash]   = useState('')
  const [userId,    setUserId]    = useState('')
  const [timezone,  setTimezone]  = useState('America/Caracas')
  const [entries,   setEntries]   = useState<DiaryEntry[]>([])
  const [editing,   setEditing]   = useState<DiaryEntry | 'new' | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'

  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    const { data } = await supabase
      .from('diary_settings').select('pin_hash')
      .eq('user_id', user.id).single()
    if (data) { setHasPin(true); setPinHash(data.pin_hash) }
    setLoading(false)
  }

  async function loadEntries() {
    const supabase = createClient()
    const { data } = await supabase
      .from('diary_entries').select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    setEntries(data || [])
  }

  async function handleUnlock() {
    setUnlocked(true)
    await loadEntries()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('diary_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function handleSave(entry: DiaryEntry) {
    setEntries(prev => {
      const exists = prev.find(e => e.id === entry.id)
      if (exists) return prev.map(e => e.id === entry.id ? entry : e)
      return [entry, ...prev]
    })
    setEditing(null)
  }

  const filtered = entries.filter(e =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.content.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#374151', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
      cargando...
    </div>
  )

  if (!unlocked) return (
    <DiaryLock hasPin={hasPin} pinHash={pinHash} onUnlock={handleUnlock} />
  )

  // EDITOR — ocupa TODO el espacio disponible
  if (editing) return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 30,
      background: '#0A0E1A',
      display: 'flex', flexDirection: 'column',
    }}>
      <DiaryEditor
        entry={editing === 'new' ? undefined : editing}
        date={editing === 'new' ? today : (editing as DiaryEntry).date}
        timezone={timezone}
        userId={userId}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    </div>
  )

  // LISTA
  return (
    <div style={{ padding: isMobile ? '12px' : '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#B026FF0D', border: '1px solid #B026FF30',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={18} color="#B026FF" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, margin: 0 }}>Mi Diario</h1>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>
              {entries.length} entradas · {timezone.split('/')[1]?.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setUnlocked(false)} title="Bloquear" style={{
            width: '34px', height: '34px', borderRadius: '8px',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--dim)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={14} />
          </button>
          <button onClick={() => setEditing('new')} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px',
            background: '#B026FF', border: 'none',
            color: '#fff', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 0 16px #B026FF44',
          }}>
            <Plus size={14} />
            {isMobile ? 'Nueva' : 'Nueva entrada'}
          </button>
        </div>
      </div>

      {/* BÚSQUEDA */}
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#374151' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar en tu diario..."
          style={{
            width: '100%', padding: '10px 14px 10px 36px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', color: 'var(--text)',
            fontSize: '13px', outline: 'none', boxSizing: 'border-box',
            fontFamily: 'Inter, sans-serif',
          }}
          onFocus={e => e.target.style.borderColor = '#B026FF44'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* HOY */}
      {!entries.find(e => e.date === today) && !search && (
        <div onClick={() => setEditing('new')} style={{
          background: 'var(--surface)', border: '1px dashed #B026FF44',
          borderRadius: '14px', padding: '18px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#B026FF88'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#B026FF44'}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: '#B026FF15', border: '1px solid #B026FF33',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          }}>✍️</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>
              ¿Qué pasó hoy?
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      )}

      {/* ENTRADAS */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📓</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
            {search ? 'Sin resultados para esa búsqueda' : 'Tu diario está vacío'}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '12px',
        }}>
          {filtered.map(e => (
            <DiaryEntryCard
              key={e.id} entry={e}
              onEdit={() => setEditing(e)}
              onDelete={() => handleDelete(e.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}