'use client'

import { useState } from 'react'
import { SavingsGoalWithProgress } from '@/types/savings'
import { SAVINGS_ICONS, formatMoney, parseAmount, round2 } from '@/lib/savings'
import ColorPicker, { firstUnusedColor } from '@/components/ui/ColorPicker'
import Button from '@/components/ui/Button'
import Modal, { fieldInput, fieldLabel } from './Modal'
import Confetti from './Confetti'
import { PiggyBank, Coins, Wallet, Trophy } from 'lucide-react'

// Todos los formularios devuelven un mensaje de error o null si salió bien:
// la página hace la escritura en la base de datos y decide qué sigue.
type Submit<T> = (values: T) => Promise<string | null>

function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div role="alert" style={{
      padding: '9px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', lineHeight: 1.4,
      background: '#FF386015', border: '1px solid #FF386033', color: 'var(--red)',
    }}>
      {msg}
    </div>
  )
}

function Toggle({ on, onChange, color }: { on: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', flexShrink: 0,
        background: on ? color : 'var(--border)', border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: '3px', left: on ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  )
}

// ── Crear / editar meta de ahorro ────────────────────────────────────────────

export interface GoalFormValues { title: string; target_amount: number; icon: string; color: string }

export function SavingsGoalModal({ goal, preset, currency, usedColors, onSubmit, onClose }: {
  goal?: SavingsGoalWithProgress
  preset?: { title: string; amount: number; icon: string }   // ejemplo rápido
  currency: string
  usedColors: string[]
  onSubmit: Submit<GoalFormValues>
  onClose: () => void
}) {
  const [title,  setTitle]  = useState(goal?.title || preset?.title || '')
  const [amount, setAmount] = useState(goal ? String(goal.target_amount) : preset ? String(preset.amount) : '')
  const [icon,   setIcon]   = useState(goal?.icon || preset?.icon || '🎯')
  const [color,  setColor]  = useState(goal?.color || firstUnusedColor(usedColors))
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    const target = parseAmount(amount)
    if (!title.trim()) { setError('Ponle un nombre a tu meta.'); return }
    if (Number.isNaN(target) || target <= 0) { setError('El monto debe ser mayor que 0.'); return }
    setSaving(true)
    const err = await onSubmit({ title: title.trim(), target_amount: target, icon, color })
    setSaving(false)
    if (err) setError(err)
  }

  return (
    <Modal
      title={goal ? 'Editar meta de ahorro' : 'Nueva meta de ahorro'}
      subtitle="¿Para qué estás ahorrando?"
      icon={<PiggyBank size={17} />} color={color} onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={fieldLabel}>¿QUÉ QUIERES LOGRAR? *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
            placeholder="Ej: Teléfono nuevo" style={fieldInput}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <div>
          <label style={fieldLabel}>MONTO A AHORRAR ({currency}) *</label>
          <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal"
            placeholder="Ej: 200" style={{ ...fieldInput, fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600 }}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          {goal && goal.saved > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '5px' }}>
              Ya llevas {formatMoney(goal.saved, currency)} abonados.
            </div>
          )}
        </div>
        <div>
          <label style={fieldLabel}>ÍCONO</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {SAVINGS_ICONS.map(ic => (
              <button key={ic} type="button" onClick={() => setIcon(ic)} aria-pressed={icon === ic} style={{
                width: '38px', height: '38px', borderRadius: '10px', fontSize: '18px', cursor: 'pointer',
                background: icon === ic ? `${color}22` : '#1a1a2e',
                border: `1px solid ${icon === ic ? color : 'var(--border)'}`,
              }}>{ic}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={fieldLabel}>COLOR</label>
          <ColorPicker value={color} onChange={setColor} usedColors={usedColors} />
        </div>
        <ErrorBox msg={error} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="md" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" size="md" loading={saving} onClick={submit}
            style={{ flex: 2, background: color, justifyContent: 'center' }}>
            {goal ? 'Guardar cambios' : 'Crear meta'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Abonar a una meta ────────────────────────────────────────────────────────

export interface ContributeValues { amount: number; note: string; isDeposit: boolean }

export function ContributeModal({ goal, currency, available, onSubmit, onClose }: {
  goal: SavingsGoalWithProgress
  currency: string
  available: number            // saldo registrado sin apartar en metas
  onSubmit: Submit<ContributeValues>
  onClose: () => void
}) {
  const [amount,    setAmount]    = useState('')
  const [note,      setNote]      = useState('')
  const [isDeposit, setIsDeposit] = useState(false)
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)

  const value    = parseAmount(amount)
  const valid    = !Number.isNaN(value) && value > 0
  const after    = valid ? round2(goal.saved + value) : goal.saved
  const afterPct = Math.min(100, Math.round((after / goal.target_amount) * 100))
  const overBalance = valid && !isDeposit && value > available

  async function submit() {
    if (!valid) { setError('Escribe un monto mayor que 0.'); return }
    setSaving(true)
    const err = await onSubmit({ amount: value, note: note.trim(), isDeposit })
    setSaving(false)
    if (err) setError(err)
  }

  const chips = [5, 10, 20, 50].filter(n => n < goal.remaining)

  return (
    <Modal title={`Abonar a ${goal.title}`} subtitle={`Faltan ${formatMoney(goal.remaining, currency)} de ${formatMoney(goal.target_amount, currency)}`}
      icon={<span>{goal.icon}</span>} color={goal.color} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={fieldLabel}>MONTO ({currency})</label>
          <input value={amount} onChange={e => { setAmount(e.target.value); setError('') }} autoFocus inputMode="decimal"
            placeholder="0.00" style={{ ...fieldInput, fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, textAlign: 'center' }}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {chips.map(n => (
              <button key={n} type="button" onClick={() => setAmount(String(n))} style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                background: '#1a1a2e', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)',
              }}>+{n}</button>
            ))}
            {goal.remaining > 0 && (
              <button type="button" onClick={() => setAmount(String(goal.remaining))} style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                background: `${goal.color}15`, border: `1px solid ${goal.color}55`, color: goal.color,
              }}>Lo que falta ({formatMoney(goal.remaining, currency)})</button>
            )}
          </div>
        </div>

        {/* Vista previa de la barra tras el abono */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginBottom: '5px' }}>
            <span>Después del abono</span>
            <span style={{ color: goal.color, fontFamily: 'var(--font-mono)' }}>{formatMoney(after, currency)} · {afterPct}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, width: `${afterPct}%`, background: `${goal.color}55`, transition: 'width 0.3s' }} />
            <div style={{ position: 'absolute', inset: 0, width: `${goal.pct}%`, background: goal.color }} />
          </div>
          {afterPct >= 100 && <div style={{ fontSize: '12px', color: goal.color, marginTop: '6px' }}>🎉 ¡Con este abono logras la meta!</div>}
        </div>

        <div>
          <label style={fieldLabel}>NOTA (opcional)</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: parte del sueldo" style={fieldInput} />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
          background: '#0d1120', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
        }}>
          <Wallet size={15} color={isDeposit ? '#F0B90B' : 'var(--muted)'} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500 }}>Es dinero nuevo que deposité en Binance</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>
              Actívalo para sumar este monto a tu saldo. Si el dinero ya estaba en tu saldo, déjalo apagado.
            </div>
          </div>
          <Toggle on={isDeposit} onChange={setIsDeposit} color="#F0B90B" />
        </div>

        {overBalance && (
          <div style={{
            padding: '9px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', lineHeight: 1.45,
            background: '#FFB80012', border: '1px solid #FFB80040', color: 'var(--amber)',
          }}>
            Tu saldo libre (sin apartar en metas) es {formatMoney(available, currency)}. Si depositaste dinero nuevo, activa la opción de arriba.
          </div>
        )}

        <ErrorBox msg={error} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="md" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" size="md" loading={saving} onClick={submit} disabled={!valid}
            style={{ flex: 2, background: goal.color, justifyContent: 'center' }}>
            <Coins size={14} /> Abonar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Meta lograda: confeti + XP + ¿descontar del saldo? ──────────────────────

export function GoalAchievedModal({ goal, currency, xp, celebrate, onWithdraw, onKeep }: {
  goal: SavingsGoalWithProgress
  currency: string
  xp: number
  celebrate: boolean             // true justo al lograrla; false al descontar más tarde
  onWithdraw: Submit<number>     // monto a descontar del saldo
  onKeep: () => void
}) {
  const [amount, setAmount] = useState(String(goal.target_amount))
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

  async function withdraw() {
    const value = parseAmount(amount)
    if (Number.isNaN(value) || value <= 0) { setError('Escribe el monto que usaste o retiraste.'); return }
    setSaving(true)
    const err = await onWithdraw(value)
    setSaving(false)
    if (err) setError(err)
  }

  return (
    <>
      {celebrate && <Confetti color={goal.color} />}
      <Modal
        title={celebrate ? '¡Lo lograste!' : `Descontar ${goal.title}`}
        subtitle={celebrate ? `Completaste tu meta "${goal.title}"` : 'Actualiza tu saldo cuando ya hayas usado el dinero'}
        icon={celebrate ? <Trophy size={17} /> : <span>{goal.icon}</span>} color={goal.color} onClose={onKeep}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {celebrate && (
            <div style={{ textAlign: 'center', padding: '6px 0 2px' }}>
              <div style={{ fontSize: '54px', lineHeight: 1, animation: 'km-pop 0.6s cubic-bezier(.34,1.56,.64,1)' }}>{goal.icon}</div>
              <style>{`@keyframes km-pop{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
              <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: goal.color, marginTop: '10px' }}>
                {formatMoney(goal.saved, currency)}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px',
                padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                background: '#FFB80018', border: '1px solid #FFB80055', color: 'var(--amber)',
              }}>
                ⚡ +{xp} XP
              </div>
            </div>
          )}

          <div style={{
            padding: '12px 14px', borderRadius: 'var(--radius-md)',
            background: '#F0B90B0D', border: '1px solid #F0B90B33',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              ¿Ya compraste o sacaste el dinero?
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '10px' }}>
              Si ya lo usaste, lo descontamos de tu saldo de Binance registrado. Si aún no, puedes dejarlo apartado y descontarlo después.
            </div>
            <label style={fieldLabel}>MONTO QUE USASTE ({currency})</label>
            <input value={amount} onChange={e => { setAmount(e.target.value); setError('') }} inputMode="decimal"
              style={{ ...fieldInput, fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600 }} />
          </div>

          <ErrorBox msg={error} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button variant="primary" size="md" loading={saving} onClick={withdraw}
              style={{ width: '100%', background: '#F0B90B', color: '#0A0E1A', justifyContent: 'center' }}>
              Sí, descontar de mi saldo
            </Button>
            <Button variant="ghost" size="md" onClick={onKeep} style={{ width: '100%', justifyContent: 'center' }}>
              Dejarlo por ahora
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ── Ajustar el saldo registrado ─────────────────────────────────────────────

export function BalanceModal({ balance, currency, onSubmit, onClose }: {
  balance: number
  currency: string
  onSubmit: Submit<{ newBalance: number; reason: string }>
  onClose: () => void
}) {
  const [value,  setValue]  = useState(String(balance))
  const [reason, setReason] = useState('')
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

  const parsed = parseAmount(value)
  const delta  = Number.isNaN(parsed) ? 0 : round2(parsed - balance)

  async function submit() {
    if (Number.isNaN(parsed) || parsed < 0) { setError('Escribe un saldo válido.'); return }
    if (delta === 0) { onClose(); return }
    setSaving(true)
    const err = await onSubmit({ newBalance: parsed, reason: reason.trim() || 'Ajuste manual del saldo' })
    setSaving(false)
    if (err) setError(err)
  }

  return (
    <Modal title="Ajustar saldo de Binance" subtitle="Escribe el saldo que ves ahora en tu app de Binance"
      icon={<Wallet size={17} />} color="#F0B90B" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={fieldLabel}>SALDO ACTUAL ({currency})</label>
          <input value={value} onChange={e => { setValue(e.target.value); setError('') }} autoFocus inputMode="decimal"
            style={{ ...fieldInput, fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, textAlign: 'center' }}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          {delta !== 0 && (
            <div style={{ fontSize: '12px', marginTop: '6px', textAlign: 'center', color: delta > 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
              {delta > 0 ? '+' : ''}{formatMoney(delta, currency)} respecto al registrado
            </div>
          )}
        </div>
        <div>
          <label style={fieldLabel}>MOTIVO (opcional)</label>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej: depósito del sueldo" style={fieldInput} />
        </div>
        <ErrorBox msg={error} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="md" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" size="md" loading={saving} onClick={submit}
            style={{ flex: 2, background: '#F0B90B', color: '#0A0E1A', justifyContent: 'center' }}>
            Guardar saldo
          </Button>
        </div>
      </div>
    </Modal>
  )
}
