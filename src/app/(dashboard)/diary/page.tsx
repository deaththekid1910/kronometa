'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { DiaryEntry } from '@/lib/diary'
import DiaryLock from '@/components/diary/DiaryLock'
import DiaryEditor from '@/components/diary/DiaryEditor'
import DiaryEntryCard from '@/components/diary/DiaryEntryCard'
import { BookOpen, Plus, Lock } from 'lucide-react'

export default function DiaryPage() {
  const [unlocked,   setUnlocked]   = useState(false)
  const [hasPin,     setHasPin]     = useState(false)
  const [pinHash,    setPinHash]    = useState('')
  const [userId,     setUserId]     = useState('')
  const [timezone,   setTimezone]   = useState('America/Caracas')
  const [entries,    setEntries]    = useState<DiaryEntry[]>([])
  const [editing,    setEditing]    = useState<DiaryEntry | null | 'new'>()
  const [loading,    setLoading]    = useState(true)
  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'

  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)

    const { data: settings } = await supabase
      .from('diary_settings')
      .select('pin_hash')
      .eq('user_id', user.id)
      .single()

    if (settings) {
      setHasPin(true)
      setPinHash(settings.pin_hash)
    }
    setLoading(false)
  }

  async function loadEntries() {
    const supabase = createClient()
    const { data } = await supabase
      .from('diary_entries')
      .select('*')
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
    setEditing(undefined)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
      cargando...
    </div>
  )

  // PANTALLA DE BLOQUEO
  if (!unlocked) return (
    <DiaryLock
      hasPin={hasPin}
      pinHash={pinHash}
      onUnlock={handleUnlock}
    />
  )

  // EDITOR
  if (editing) return (
    <div style={{ padding: isMobile ? '12px' : '24px 20px', maxWidth: '760px', margin: '0 auto' }}>
      <div style={{
        background: '#131829', border: '1px solid #1F2937',
        borderRadius: '16px', padding: isMobile ? '16px' : '24px',
      }}>
        <DiaryEditor
          entry={editing === 'new' ? undefined : editing}
          date={editing === 'new' ? today : (editing as DiaryEntry).date}
          timezone={timezone}
          userId={userId}
          onSave={handleSave}
          onCancel={() => setEditing(undefined)}
        />
      </div>
    </div>
  )

  // LISTA DE ENTRADAS
  return (
    <div style={{ padding: isMobile ? '12px' : '24px 20px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
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
              {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'} · {timezone.split('/')[1]?.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setUnlocked(false) }}
            title="Bloquear diario"
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: '#ffffff08', border: '1px solid #1F2937',
              color: '#64748B', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Lock size={15} />
          </button>

          <button
            onClick={() => setEditing('new')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '8px',
              background: '#B026FF', border: 'none',
              color: '#fff', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              boxShadow: '0 0 16px #B026FF44',
            }}
          >
            <Plus size={15} />
            {isMobile ? 'Nueva' : 'Nueva entrada'}
          </button>
        </div>
      </div>

      {/* ENTRADA DE HOY */}
      {!entries.find(e => e.date === today) && (
        <div
          onClick={() => setEditing('new')}
          style={{
            background: '#131829',
            border: '1px dashed #B026FF44',
            borderRadius: '14px', padding: '20px',
            marginBottom: '16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '14px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#B026FF88'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#B026FF44'}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: '#B026FF15', border: '1px solid #B026FF33',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>✍️</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#F1F5F9', marginBottom: '2px' }}>
              Escribe la entrada de hoy
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      )}

      {/* ENTRADAS */}
      {entries.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 1rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
        }}>
          <div style={{ fontSize: '48px' }}>📓</div>
          <div style={{ fontSize: '15px', fontWeight: 500 }}>Tu diario está vacío</div>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Escribe tu primera entrada para empezar</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '12px',
        }}>
          {entries.map(entry => (
            <DiaryEntryCard
              key={entry.id}
              entry={entry}
              onEdit={() => setEditing(entry)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}