'use client'

import { useState } from 'react'
import { SavingsGoalWithProgress } from '@/types/savings'
import { formatMoney } from '@/lib/savings'
import { Coins, Pencil, Trash2, ChevronDown, Wallet, CheckCircle2 } from 'lucide-react'

interface Props {
  goal: SavingsGoalWithProgress
  currency: string
  onContribute: () => void
  onWithdraw: () => void
  onEdit: () => void
  onDelete: () => void
  onDeleteContribution: (id: string) => void
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SavingsGoalCard({ goal, currency, onContribute, onWithdraw, onEdit, onDelete, onDeleteContribution }: Props) {
  const [open,       setOpen]       = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const accent   = goal.color
  const done     = goal.status !== 'active'
  const withdrawn = goal.status === 'withdrawn'

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${done ? accent + '55' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', padding: '18px',
      position: 'relative', overflow: 'hidden',
      opacity: withdrawn ? 0.8 : 1,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
      }} />

      {/* CABECERA: ícono + estado a la izquierda, acciones a la derecha */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0, fontSize: '20px',
            background: accent + '15', border: `1px solid ${accent}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{goal.icon}</div>
          <span style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
            color: withdrawn ? 'var(--muted)' : done ? accent : 'var(--muted)',
            display: 'inline-flex', alignItems: 'center', gap: '4px',
          }}>
            {withdrawn ? <><CheckCircle2 size={12} /> Usada</> : done ? <>🏆 ¡Lograda!</> : 'Ahorrando'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {!withdrawn && (
            <button onClick={onEdit} title="Editar meta" aria-label="Editar meta" style={iconBtn(accent)}>
              <Pencil size={13} />
            </button>
          )}
          <button onClick={() => setConfirmDel(true)} title="Eliminar meta" aria-label="Eliminar meta" style={iconBtn('#FF3860')}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
        {goal.title}
      </h3>

      {/* MONTOS Y BARRA */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: accent }}>
          {formatMoney(goal.saved, currency)}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          de {formatMoney(goal.target_amount, currency)}
        </span>
      </div>
      <div style={{ height: '10px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${goal.pct}%`,
          background: `linear-gradient(90deg, ${accent}88, ${accent})`,
          boxShadow: `0 0 10px ${accent}66`, borderRadius: '6px',
          transition: 'width 0.8s cubic-bezier(.34,1.2,.64,1)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginTop: '6px', gap: '8px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', color: accent }}>{goal.pct}%</span>
        <span>
          {withdrawn
            ? `Descontado ${formatMoney(goal.withdrawn_amount ?? goal.target_amount, currency)}${goal.withdrawn_at ? ` · ${shortDate(goal.withdrawn_at)}` : ''}`
            : done ? 'Dinero apartado en tu saldo' : `Faltan ${formatMoney(goal.remaining, currency)}`}
        </span>
      </div>

      {/* ACCIÓN PRINCIPAL */}
      {goal.status === 'active' && (
        <button onClick={onContribute} style={mainBtn(accent)}>
          <Coins size={15} /> Abonar
        </button>
      )}
      {goal.status === 'completed' && (
        <button onClick={onWithdraw} style={mainBtn('#F0B90B')}>
          <Wallet size={15} /> Ya lo usé · descontar de Binance
        </button>
      )}

      {/* HISTORIAL DE ABONOS */}
      {goal.contributions.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <button onClick={() => setOpen(o => !o)} aria-expanded={open} style={{
            display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none',
            color: 'var(--muted)', fontSize: '12px', cursor: 'pointer', padding: 0,
          }}>
            <ChevronDown size={13} style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
            {goal.contributions.length} {goal.contributions.length === 1 ? 'abono' : 'abonos'}
          </button>
          {open && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {goal.contributions.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                  background: '#ffffff05', border: '1px solid var(--border)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: accent, fontWeight: 600 }}>
                      +{formatMoney(c.amount, currency)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                      {shortDate(c.created_at)}{c.note ? ` · ${c.note}` : ''}
                    </div>
                  </div>
                  {!withdrawn && (
                    <button onClick={() => onDeleteContribution(c.id)} title="Quitar este abono" aria-label="Quitar este abono"
                      style={{ ...iconBtn('#FF3860'), width: '26px', height: '26px' }}>
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONFIRMAR ELIMINAR */}
      {confirmDel && (
        <div style={{
          marginTop: '12px', padding: '12px', borderRadius: 'var(--radius-sm)',
          background: '#FF386010', border: '1px solid #FF386033',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.5, marginBottom: '10px' }}>
            ¿Eliminar esta meta y sus abonos?
            {goal.completed_at && ' Perderás el XP que te dio al lograrla.'}
            {goal.status !== 'withdrawn' && goal.saved > 0 && ' El dinero sigue en tu saldo, solo deja de estar apartado.'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onDelete} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--red)',
              border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>Eliminar</button>
            <button onClick={() => setConfirmDel(false)} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: 'transparent',
              border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer',
            }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

function iconBtn(color: string): React.CSSProperties {
  return {
    width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
    background: `${color}12`, border: `1px solid ${color}30`, color,
    cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}

function mainBtn(color: string): React.CSSProperties {
  return {
    marginTop: '14px', width: '100%', padding: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    background: `${color}18`, border: `1px solid ${color}55`, color,
    fontSize: '13px', fontWeight: 600,
  }
}
