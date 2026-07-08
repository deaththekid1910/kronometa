'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoals } from '@/hooks/useGoals'
import { createClient } from '@/lib/supabase'
import { GoalWithStats } from '@/types'
import GoalCard from '@/components/goals/GoalCard'
import CreateGoalModal from '@/components/goals/CreateGoalModal'
import EditGoalModal from '@/components/goals/EditGoalModal'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Target, Plus } from 'lucide-react'

export default function GoalsPage() {
  const { goals, loading, updateGoal, removeGoal } = useGoals()
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<GoalWithStats | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GoalWithStats | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('goals').update({ archived: true }).eq('id', deleteTarget.id)
    removeGoal(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
  }

  const metas = goals.filter(g => g.type === 'goal')

  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px' }}>Metas y Proyectos</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
            Gestiona tus proyectos y sus submetas
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
          Nueva meta
        </Button>
      </div>

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
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {metas.map(g => (
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
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <CreateGoalModal onClose={() => setShowModal(false)} />
        </div>
      )}

      {editTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <EditGoalModal
            goal={editTarget}
            onSave={updated => updateGoal(updated.id, updated)}
            onClose={() => setEditTarget(null)}
          />
        </div>
      )}

      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
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
        </div>
      )}
    </div>
  )
}