'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoals } from '@/hooks/useGoals'
import { createClient } from '@/lib/supabase'
import { GoalWithStats } from '@/types'
import GoalCard from '@/components/goals/GoalCard'
import CreateGoalModal from '@/components/goals/CreateGoalModal'
import EditGoalModal from '@/components/goals/EditGoalModal'
import Button from '@/components/ui/Button'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { TabBar, StatRow, PageHeader, PageShell, ModalBackdrop } from '@/components/ui/Layout'
import { Target, Plus, Flag, Trophy, LayoutGrid } from 'lucide-react'

type Filter = 'active' | 'done' | 'all'
const FILTER_KEY = 'kronometa.goals.filter'

// Una meta está completada cuando tiene submetas y todas están hechas
function isDone(g: GoalWithStats): boolean {
  const sgs = g.sub_goals || []
  return sgs.length > 0 && sgs.every(sg => sg.completed_at)
}

export default function GoalsPage() {
  const { goals, loading, updateGoal, removeGoal } = useGoals()
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<GoalWithStats | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GoalWithStats | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [filter, setFilter] = useState<Filter>('active')
  const [nowMs] = useState(() => Date.now())
  const router = useRouter()
  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FILTER_KEY)
      if (saved === 'active' || saved === 'done' || saved === 'all') setFilter(saved)
    } catch {}
  }, [])

  function selectFilter(f: Filter) {
    setFilter(f)
    try { localStorage.setItem(FILTER_KEY, f) } catch {}
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('goals').update({ archived: true }).eq('id', deleteTarget.id)
    removeGoal(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
  }

  const metas    = goals.filter(g => g.type === 'goal')
  const active   = metas.filter(g => !isDone(g))
  const done     = metas.filter(isDone)
  const visible  = filter === 'active' ? active : filter === 'done' ? done : metas

  const allSubs  = metas.reduce((a, g) => a + (g.sub_goals?.length || 0), 0)
  const doneSubs = metas.reduce((a, g) => a + (g.sub_goals?.filter(sg => sg.completed_at).length || 0), 0)
  const next     = active
    .filter(g => g.deadline && new Date(g.deadline).getTime() > nowMs)
    .sort((x, y) => new Date(x.deadline!).getTime() - new Date(y.deadline!).getTime())[0]

  return (
    <PageShell isMobile={isMobile}>
      <PageHeader
        icon={<Target size={18} />} color="#00F5FF" title="Metas y Proyectos"
        subtitle="Gestiona tus proyectos y sus submetas" isMobile={isMobile}
        action={
          <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
            Nueva meta
          </Button>
        }
      />

      {!loading && metas.length > 0 && (
        <>
          <StatRow isMobile={isMobile} stats={[
            { label: 'En curso',    value: active.length, color: 'var(--cyan)' },
            { label: 'Completadas', value: done.length,   color: 'var(--green)' },
            { label: 'Submetas',    value: `${doneSubs}/${allSubs}`, hint: 'completadas', color: 'var(--purple)',
              bar: allSubs > 0 ? Math.round((doneSubs / allSubs) * 100) : 0 },
            { label: 'Próximo vencimiento',
              value: next ? new Date(next.deadline!).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' }) : '—',
              hint: next?.title || 'Sin fechas próximas', color: next?.color || 'var(--muted)' },
          ]} />

          <TabBar<Filter>
            isMobile={isMobile} active={filter} onChange={selectFilter}
            tabs={[
              { id: 'active', label: 'En curso',    icon: <Flag size={14} />,       color: 'var(--cyan)',  count: active.length },
              { id: 'done',   label: 'Completadas', icon: <Trophy size={14} />,     color: 'var(--green)', count: done.length },
              { id: 'all',    label: 'Todas',       icon: <LayoutGrid size={14} />, color: 'var(--purple)', count: metas.length },
            ]}
          />
        </>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando...
        </div>
      ) : metas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#00F5FF0D', border: '1px solid #00F5FF20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={28} color="var(--cyan)" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>Sin metas aún</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Crea tu primera meta o proyecto</div>
          </div>
          <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
            Crear meta
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)', fontSize: '13px',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
        }}>
          {filter === 'done' ? 'Aún no completas ninguna meta. ¡Vas en camino!' : 'No tienes metas en curso.'}
        </div>
      ) : (
        <div style={{
          display: 'grid', alignItems: 'start', gap: isMobile ? '12px' : '16px',
          gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(auto-fill, minmax(320px, 1fr))',
        }}>
          {visible.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              onClick={() => router.push(`/goals/${g.id}`)}
              onEdit={() => setEditTarget(g)}
              onDelete={() => setDeleteTarget(g)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ModalBackdrop>
          <CreateGoalModal onClose={() => setShowModal(false)} />
        </ModalBackdrop>
      )}

      {editTarget && (
        <ModalBackdrop>
          <EditGoalModal
            goal={editTarget}
            onSave={updated => updateGoal(updated.id, updated)}
            onClose={() => setEditTarget(null)}
          />
        </ModalBackdrop>
      )}

      {deleteTarget && (
        <ModalBackdrop>
          <div style={{
            background: 'var(--surface)', border: '1px solid #FF386044',
            borderRadius: 'var(--radius-xl)', padding: '24px',
            width: '100%', maxWidth: '380px',
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 500, margin: '0 0 10px' }}>Eliminar meta</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
              ¿Eliminar <strong>{deleteTarget.title}</strong> y todas sus submetas? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" size="md" onClick={() => setDeleteTarget(null)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button
                variant="danger" size="md" loading={deleting} onClick={handleConfirmDelete}
                style={{ flex: 2, justifyContent: 'center', background: 'var(--red)', color: '#fff', border: 'none' }}
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </PageShell>
  )
}