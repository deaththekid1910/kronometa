'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { DiaryEntry, MOODS, diaryPlainText, entryDay, entryTime } from '@/lib/diary'
import DiaryLock from '@/components/diary/DiaryLock'
import DiaryEditor from '@/components/diary/DiaryEditorWrapper'
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
    if (!user) { setLoading(false); return }
    setUserId(user.id)
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    const { data } = await supabase
      .from('diary_settings').select('pin_hash')
      .eq('user_id', user.id).single()
    if (data) { setHasPin(true); setPinHash(data.pin_hash) }
    setLoading(false)
  }

  async function loadEntries() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('diary_entries').select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
      if (error) console.error('[Diary] loadEntries:', error.message)
      setEntries(data || [])
    } catch (err) {
      console.error('[Diary] loadEntries exception:', err)
      setEntries([])
    }
  }

  async function handleUnlock() {
    setUnlocked(true)
    await loadEntries()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('diary_entries').delete().eq('id', id)
    // Solo se quita de la lista si de verdad se borró en la base de datos
    if (error) {
      window.alert('No se pudo eliminar la entrada. Inténtalo de nuevo.')
      return
    }
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  // Al cerrar sin "Guardar", el autoguardado pudo haber cambiado el contenido:
  // se recarga la lista para no mostrar una versión vieja.
  function handleCancel() {
    const wasExisting = editing !== 'new'
    setEditing(null)
    if (wasExisting) loadEntries()
  }

  function handleSave(entry: DiaryEntry) {
    setEntries(prev => {
      const exists = prev.find(e => e.id === entry.id)
      if (exists) return prev.map(e => e.id === entry.id ? entry : e)
      return [entry, ...prev]
    })
    setEditing(null)
  }

  // Más recientes primero: por fecha y, dentro del mismo día, por hora
  const sorted = useMemo(() => [...entries].sort((a, b) => {
    const d = entryDay(b).localeCompare(entryDay(a))
    return d !== 0 ? d : (entryTime(b) || '').localeCompare(entryTime(a) || '')
  }), [entries])

  // Búsqueda sobre el texto real (sin etiquetas HTML ni imágenes), el título
  // y el estado de ánimo
  const plainById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const e of entries) map[e.id] = diaryPlainText(e.content).toLowerCase()
    return map
  }, [entries])

  const q = search.trim().toLowerCase()
  const filtered = !q ? sorted : sorted.filter(e => {
    const mood = MOODS.find(m => m.key === e.mood)?.label.toLowerCase() || ''
    return (e.title || '').toLowerCase().includes(q) || plainById[e.id]?.includes(q) || mood.includes(q)
  })

  // Agrupadas por mes: "Septiembre 2026"
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: DiaryEntry[] }[] = []
    for (const e of filtered) {
      const key = entryDay(e).slice(0, 7)
      let g = out[out.length - 1]
      if (!g || g.key !== key) {
        const label = new Date(key + '-15T12:00:00').toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })
        g = { key, label: label.charAt(0).toUpperCase() + label.slice(1), items: [] }
        out.push(g)
      }
      g.items.push(e)
    }
    return out
  }, [filtered])

  // Resumen: entradas del mes, racha de días escribiendo y ánimo frecuente
  const stats = useMemo(() => {
    const days = new Set(entries.map(entryDay))
    let streak = 0
    const d = new Date(today + 'T12:00:00')
    if (!days.has(today)) d.setDate(d.getDate() - 1)   // la racha sigue viva si escribiste ayer
    while (days.has(d.toLocaleDateString('en-CA'))) { streak++; d.setDate(d.getDate() - 1) }

    const since = new Date(today + 'T12:00:00')
    since.setDate(since.getDate() - 29)
    const sinceStr = since.toLocaleDateString('en-CA')
    const moodCount: Record<string, number> = {}
    for (const e of entries) if (entryDay(e) >= sinceStr) moodCount[e.mood] = (moodCount[e.mood] || 0) + 1
    const topMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]

    return {
      thisMonth: entries.filter(e => entryDay(e).startsWith(today.slice(0, 7))).length,
      streak,
      topMood: topMood ? MOODS.find(m => m.key === topMood[0]) : undefined,
    }
  }, [entries, today])

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
    {typeof window !== 'undefined' && (
      <DiaryEditor
        entry={editing === 'new' ? undefined : editing as DiaryEntry}
        date={editing === 'new' ? today : (editing as DiaryEntry).date}
        timezone={timezone}
        userId={userId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    )}
  </div>
)

  // LISTA
  return (
    <div style={{ padding: isMobile ? '12px' : '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

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
              {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'} · {timezone.split('/').pop()?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setUnlocked(false)} title="Bloquear diario" aria-label="Bloquear diario" style={{
            width: '34px', height: '34px', borderRadius: '8px',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--muted)', cursor: 'pointer',
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

      {/* RESUMEN */}
      {entries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: isMobile ? '8px' : '10px' }}>
          {[
            { label: 'Este mes',        value: String(stats.thisMonth), hint: stats.thisMonth === 1 ? 'entrada' : 'entradas', color: '#B026FF' },
            { label: 'Racha',           value: `${stats.streak}d`, hint: 'días seguidos escribiendo', color: '#FFB800' },
            { label: 'Ánimo frecuente', value: stats.topMood?.emoji || '—', hint: stats.topMood ? `${stats.topMood.label} · 30 días` : 'últimos 30 días', color: stats.topMood?.color || 'var(--muted)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: isMobile ? '10px 12px' : '12px 16px', minWidth: 0,
            }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: isMobile ? '17px' : '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1.2 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px', lineHeight: 1.35 }}>{s.hint}</div>
            </div>
          ))}
        </div>
      )}

      {/* BÚSQUEDA */}
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título, texto o ánimo..."
          aria-label="Buscar en tu diario"
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
      {!entries.find(e => entryDay(e) === today) && !search && (
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

      {/* ENTRADAS — agrupadas por mes */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📓</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
            {search ? 'Sin resultados para esa búsqueda' : 'Tu diario está vacío'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {search && (
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
            </div>
          )}
          {groups.map(g => (
            <section key={g.key}>
              <h2 style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                fontSize: '12px', fontWeight: 600, color: 'var(--muted)',
                letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 10px',
              }}>
                {g.label}
                <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: 'none', color: '#64748B' }}>· {g.items.length}</span>
                <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '12px',
              }}>
                {g.items.map(e => (
                  <DiaryEntryCard
                    key={e.id} entry={e}
                    onEdit={() => setEditing(e)}
                    onDelete={() => handleDelete(e.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}