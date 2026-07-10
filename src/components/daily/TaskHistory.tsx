'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { DailyTask } from '@/types/dailyTask'
import { localToday } from '@/lib/dailyTasks'
import { useDebounce } from '@/hooks/useDebounce'
import DailyTaskItem from './DailyTaskItem'
import { Search, X, ChevronLeft, ChevronRight, History } from 'lucide-react'

const ACCENT = '#FFB800'
const PER_PAGE = 20

type Estado = 'todas' | 'completada' | 'incompleta' | 'pendiente'
type Orden = 'fecha_desc' | 'fecha_asc' | 'titulo_asc' | 'titulo_desc'

interface Props {
  userId: string
  refreshToken?: number                          // incrementa desde el padre para forzar recarga
  onTaskChanged?: (task: DailyTask) => void       // propaga el cambio (completar/reactivar/editar) al padre
  onTaskDeleted?: (id: string) => void
}

// Escapa caracteres reservados del filtro `.or()` de PostgREST (`,`, `(`, `)`, `%`).
function escapeForOr(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/[%,()]/g, c => '\\' + c)
}

function taskColor(t: DailyTask, today: string): { color: string; overdue: boolean } {
  if (t.completed_at) return { color: '#00FF88', overdue: false }
  if (t.task_date < today) return { color: '#FFB800', overdue: true }
  return { color: '#00F5FF', overdue: false }
}

export default function TaskHistory({ userId, refreshToken = 0, onTaskChanged, onTaskDeleted }: Props) {
  const today = localToday()

  const [tasks,   setTasks]   = useState<DailyTask[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [toast,   setToast]   = useState<string | null>(null)

  const [search,      setSearch]      = useState('')
  const [fechaDesde,  setFechaDesde]  = useState('')
  const [fechaHasta,  setFechaHasta]  = useState('')
  const [estado,      setEstado]      = useState<Estado>('todas')
  const [orden,       setOrden]       = useState<Orden>('fecha_desc')

  const debouncedSearch = useDebounce(search, 300)
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  // Cualquier cambio de filtro reinicia a la página 1.
  useEffect(() => { setPage(1) }, [debouncedSearch, fechaDesde, fechaHasta, estado, orden])

  // refreshToken: cambia cuando una tarea se completa/reactiva/borra desde
  // las secciones HOY/INCOMPLETAS de la página principal, para mantener el
  // historial sincronizado sin perder la página/filtros actuales.
  useEffect(() => {
    if (userId) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, page, debouncedSearch, fechaDesde, fechaHasta, estado, orden, refreshToken])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function load() {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('daily_tasks')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (debouncedSearch.trim()) {
      const esc = escapeForOr(debouncedSearch.trim())
      query = query.or(`title.ilike.%${esc}%,description.ilike.%${esc}%`)
    }
    if (fechaDesde) query = query.gte('task_date', fechaDesde)
    if (fechaHasta) query = query.lte('task_date', fechaHasta)
    if (estado === 'completada') query = query.not('completed_at', 'is', null)
    if (estado === 'pendiente')  query = query.is('completed_at', null).gte('task_date', today)
    if (estado === 'incompleta') query = query.is('completed_at', null).lt('task_date', today)

    if (orden === 'fecha_asc')       query = query.order('task_date', { ascending: true })
    else if (orden === 'titulo_asc') query = query.order('title', { ascending: true })
    else if (orden === 'titulo_desc') query = query.order('title', { ascending: false })
    else                              query = query.order('task_date', { ascending: false })
    query = query.order('created_at', { ascending: false })

    const from = (page - 1) * PER_PAGE
    const { data, count } = await query.range(from, from + PER_PAGE - 1)

    setTasks(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  function handleClear() {
    setSearch('')
    setFechaDesde('')
    setFechaHasta('')
    setEstado('todas')
    setOrden('fecha_desc')
  }

  const hasFilters = !!(search || fechaDesde || fechaHasta || estado !== 'todas' || orden !== 'fecha_desc')

  // Los handlers de DailyTaskItem ya hicieron el update en Supabase; aquí solo
  // recargamos la página actual (respeta filtros) y avisamos al padre para
  // que la tarea aparezca/desaparezca de HOY/INCOMPLETAS sin recargar la app.
  function handleComplete(id: string) {
    const t = tasks.find(x => x.id === id)
    if (t) onTaskChanged?.({ ...t, completed_at: new Date().toISOString() })
    showToast('Tarea completada ✅')
    load()
  }
  function handleUncomplete(id: string) {
    const t = tasks.find(x => x.id === id)
    if (t) {
      const updated = { ...t, completed_at: null }
      onTaskChanged?.(updated)
      const seccion = updated.task_date < today ? 'INCOMPLETAS' : 'HOY'
      showToast(`↺ Tarea reactivada — ahora está en ${seccion}`)
    }
    load()
  }
  function handleUpdate(updated: DailyTask) {
    onTaskChanged?.(updated)
    load()
  }
  function handleDelete(id: string) {
    onTaskDeleted?.(id)
    load()
  }

  return (
    <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <History size={14} color={ACCENT} />
        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>
          HISTORIAL
        </span>
        <span style={{ fontSize: '11px', color: 'var(--dim)' }}>
          · {total} {total === 1 ? 'tarea' : 'tareas'}
        </span>
      </div>

      {/* FILTROS */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={14} color="var(--dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 34px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '13px', outline: 'none',
            }}
          />
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px', marginBottom: '12px',
        }}>
          <Field label="Desde">
            <input type="date" value={fechaDesde} max={fechaHasta || undefined} onChange={e => setFechaDesde(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Hasta">
            <input type="date" value={fechaHasta} min={fechaDesde || undefined} onChange={e => setFechaHasta(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Estado">
            <select value={estado} onChange={e => setEstado(e.target.value as Estado)} style={inputStyle}>
              <option value="todas">Todas</option>
              <option value="completada">Completadas</option>
              <option value="incompleta">Incompletas</option>
              <option value="pendiente">Pendientes</option>
            </select>
          </Field>
          <Field label="Ordenar">
            <select value={orden} onChange={e => setOrden(e.target.value as Orden)} style={inputStyle}>
              <option value="fecha_desc">Más recientes primero</option>
              <option value="fecha_asc">Más antiguas primero</option>
              <option value="titulo_asc">Título A-Z</option>
              <option value="titulo_desc">Título Z-A</option>
            </select>
          </Field>
        </div>

        {hasFilters && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleClear} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              background: '#FF386010', border: '1px solid #FF386030',
              color: 'var(--red)', fontSize: '12px', cursor: 'pointer', fontWeight: 500,
            }}>
              <X size={12} /> Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* LISTA */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando...
        </div>
      ) : tasks.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '2.5rem',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          color: 'var(--dim)', fontSize: '13px',
        }}>
          {hasFilters ? 'No se encontraron tareas con esos filtros.' : 'Aún no hay tareas en tu historial.'}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {tasks.map(t => {
              const { color, overdue } = taskColor(t, today)
              return (
                <DailyTaskItem
                  key={t.id} task={t} color={color} overdue={overdue}
                  onComplete={handleComplete} onUncomplete={handleUncomplete}
                  onUpdate={handleUpdate} onDelete={handleDelete}
                />
              )
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={pageBtn(page === 1)}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={pageBtn(page === totalPages)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '24px', zIndex: 99,
          background: 'var(--surface)', border: `1px solid ${ACCENT}66`,
          borderRadius: '12px', padding: '12px 16px',
          fontSize: '13px', color: 'var(--text)', fontWeight: 500,
          boxShadow: `0 0 24px ${ACCENT}22`, maxWidth: '320px',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 9px',
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '12px',
  colorScheme: 'dark',
}

function pageBtn(disabled: boolean): React.CSSProperties {
  return {
    width: '30px', height: '30px', borderRadius: '8px',
    background: 'transparent', border: '1px solid var(--border)',
    color: disabled ? 'var(--dim)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}
