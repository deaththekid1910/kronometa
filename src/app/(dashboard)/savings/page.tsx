'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useXPStore } from '@/store/xpStore'
import { playAchievementSound } from '@/lib/notificationSound'
import {
  SavingsData, loadSavings, allocatedAmount, formatMoney, round2, adjustBalance,
  createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addContribution, deleteContribution,
  SAVINGS_GOAL_XP,
} from '@/lib/savings'
import { BinanceProfile, SavingsGoalWithProgress } from '@/types/savings'
import BinanceProfileForm from '@/components/savings/BinanceProfileForm'
import SavingsGoalCard from '@/components/savings/SavingsGoalCard'
import Modal from '@/components/savings/Modal'
import {
  SavingsGoalModal, ContributeModal, GoalAchievedModal, BalanceModal, GoalFormValues,
} from '@/components/savings/SavingsModals'
import { Vault, Plus, Wallet, UserCog, History, Mail, IdCard, ArrowDownRight, ArrowUpRight, Database } from 'lucide-react'

const BINANCE = '#F0B90B'

const EXAMPLES = [
  { title: 'Teléfono nuevo',   amount: 200, icon: '📱' },
  { title: 'Balón de fútbol',  amount: 50,  icon: '⚽' },
  { title: 'Pasaporte',        amount: 245, icon: '🛂' },
]

type Preset = (typeof EXAMPLES)[number]

export default function SavingsPage() {
  const [userId,  setUserId]  = useState('')
  const [data,    setData]    = useState<SavingsData | null>(null)
  const [loading, setLoading] = useState(true)

  // Ventanas abiertas
  const [editProfile, setEditProfile] = useState(false)
  const [goalForm,    setGoalForm]    = useState<{ goal?: SavingsGoalWithProgress; preset?: Preset } | null>(null)
  const [contribute,  setContribute]  = useState<SavingsGoalWithProgress | null>(null)
  const [achieved,    setAchieved]    = useState<{ goal: SavingsGoalWithProgress; celebrate: boolean } | null>(null)
  const [balanceOpen, setBalanceOpen] = useState(false)
  const [notice,      setNotice]      = useState('')

  const addXP    = useXPStore(s => s.addXP)
  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'

  const reload = useCallback(async (uid: string) => {
    const d = await loadSavings(uid)
    setData(d)
    return d
  }, [])

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)
      await reload(user.id)
      setLoading(false)
    })()
  }, [reload])

  const profile   = data?.profile ?? null
  const goals     = data?.goals ?? []
  const currency  = profile?.currency || 'USDT'
  const allocated = allocatedAmount(goals)
  const available = round2((profile?.balance ?? 0) - allocated)
  const active    = goals.filter(g => g.status === 'active')
  const finished  = goals.filter(g => g.status !== 'active')
    .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))

  function flash(msg: string) {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3500)
  }

  // Marca una meta como lograda: +XP, sonido y ventana de celebración
  async function markCompleted(goalId: string): Promise<string | null> {
    const { error } = await updateSavingsGoal(goalId, { status: 'completed', completed_at: new Date().toISOString() })
    if (error) return 'El abono se guardó, pero no se pudo marcar la meta como lograda.'
    addXP(SAVINGS_GOAL_XP)
    playAchievementSound()
    const d = await reload(userId)
    const g = d.goals.find(x => x.id === goalId)
    if (g) setAchieved({ goal: g, celebrate: true })
    return null
  }

  // Si una meta lograda vuelve a quedar por debajo del objetivo, vuelve a "ahorrando"
  async function reopenIfBelow(goal: SavingsGoalWithProgress, saved: number, target: number) {
    if (goal.status === 'completed' && saved < target) {
      await updateSavingsGoal(goal.id, { status: 'active', completed_at: null })
      addXP(-SAVINGS_GOAL_XP)
    }
  }

  // ── Acciones ──────────────────────────────────────────────────────────────

  async function handleGoalSubmit(values: GoalFormValues): Promise<string | null> {
    const editing = goalForm?.goal
    if (!editing) {
      const { error } = await createSavingsGoal(userId, values)
      if (error) return 'No se pudo crear la meta. Inténtalo de nuevo.'
      await reload(userId)
      setGoalForm(null)
      flash(`Meta "${values.title}" creada`)
      return null
    }
    const { error } = await updateSavingsGoal(editing.id, values)
    if (error) return 'No se pudieron guardar los cambios.'
    setGoalForm(null)
    // Cambiar el objetivo puede lograr la meta o devolverla a "ahorrando"
    if (editing.status === 'active' && editing.saved >= values.target_amount) return markCompleted(editing.id)
    await reopenIfBelow(editing, editing.saved, values.target_amount)
    await reload(userId)
    return null
  }

  async function handleContribute(goal: SavingsGoalWithProgress, v: { amount: number; note: string; isDeposit: boolean }) {
    if (v.isDeposit) {
      const { error } = await adjustBalance(v.amount, `Depósito para "${goal.title}"`, goal.id)
      if (error) return 'No se pudo sumar el depósito a tu saldo. No se registró el abono.'
    }
    const { error } = await addContribution(userId, goal.id, v.amount, v.note)
    if (error) return 'No se pudo registrar el abono. Inténtalo de nuevo.'
    setContribute(null)
    if (round2(goal.saved + v.amount) >= goal.target_amount) return markCompleted(goal.id)
    await reload(userId)
    flash(`+${formatMoney(v.amount, currency)} abonados a "${goal.title}"`)
    return null
  }

  async function handleWithdraw(goal: SavingsGoalWithProgress, amount: number) {
    const { error } = await adjustBalance(-amount, `Meta lograda: "${goal.title}"`, goal.id)
    if (error) return 'No se pudo descontar del saldo. Inténtalo de nuevo.'
    await updateSavingsGoal(goal.id, {
      status: 'withdrawn', withdrawn_at: new Date().toISOString(), withdrawn_amount: amount,
    })
    setAchieved(null)
    await reload(userId)
    flash(`Se descontaron ${formatMoney(amount, currency)} de tu saldo`)
    return null
  }

  async function handleDeleteGoal(goal: SavingsGoalWithProgress) {
    const { error } = await deleteSavingsGoal(goal.id)
    if (error) { flash('No se pudo eliminar la meta.'); return }
    if (goal.completed_at) addXP(-SAVINGS_GOAL_XP)
    await reload(userId)
  }

  async function handleDeleteContribution(goal: SavingsGoalWithProgress, id: string) {
    const c = goal.contributions.find(x => x.id === id)
    if (!c || !window.confirm(`¿Quitar el abono de ${formatMoney(c.amount, currency)}?`)) return
    const { error } = await deleteContribution(id)
    if (error) { flash('No se pudo quitar el abono.'); return }
    await reopenIfBelow(goal, round2(goal.saved - c.amount), goal.target_amount)
    await reload(userId)
  }

  async function handleBalance(v: { newBalance: number; reason: string }) {
    const delta = round2(v.newBalance - (profile?.balance ?? 0))
    const { error } = await adjustBalance(delta, v.reason)
    if (error) return 'No se pudo actualizar el saldo.'
    setBalanceOpen(false)
    await reload(userId)
    return null
  }

  function handleProfileSaved(p: BinanceProfile) {
    setData(d => d ? { ...d, profile: p } : d)
    setEditProfile(false)
    reload(userId)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const padding = isMobile ? '12px' : '24px 20px'

  if (loading) return (
    <div style={{ padding, color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px', textAlign: 'center', paddingTop: '4rem' }}>
      cargando almacén...
    </div>
  )

  return (
    <div style={{ padding, maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: `${BINANCE}12`, border: `1px solid ${BINANCE}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Vault size={18} color={BINANCE} />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, margin: 0 }}>Almacén</h1>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>Ahorra para lo que quieres, paso a paso</p>
          </div>
        </div>
        {profile && (
          <button onClick={() => setGoalForm({})} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: 'var(--radius-sm)',
            background: 'var(--green)', border: 'none', color: '#0A0E1A', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 0 16px #00FF8844',
          }}>
            <Plus size={15} /> {isMobile ? 'Nueva' : 'Nueva meta de ahorro'}
          </button>
        )}
      </div>

      {/* MIGRACIÓN PENDIENTE */}
      {data?.missingTables && (
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px',
          background: '#FFB80010', border: '1px solid #FFB80040', borderRadius: 'var(--radius-lg)',
        }}>
          <Database size={18} color="var(--amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
            <strong>Falta preparar la base de datos.</strong> Abre el editor SQL de Supabase, pega el contenido de
            <code style={{ margin: '0 4px', padding: '1px 6px', background: '#0d1120', borderRadius: '4px', color: 'var(--cyan)' }}>supabase/savings.sql</code>
            y ejecútalo. Luego recarga esta página.
          </div>
        </div>
      )}

      {/* CONFIGURACIÓN INICIAL */}
      {!data?.missingTables && !profile && (
        <div style={{
          background: 'var(--surface)', border: `1px solid ${BINANCE}40`, borderRadius: 'var(--radius-lg)',
          padding: isMobile ? '18px' : '28px', maxWidth: '620px', width: '100%', margin: '0 auto', boxSizing: 'border-box',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏦</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>Configura tu cuenta de Binance</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
              Registra tus datos y tu saldo actual. Después podrás crear metas de ahorro e ir abonando.
            </p>
          </div>
          <BinanceProfileForm userId={userId} profile={null} onSaved={handleProfileSaved} />
        </div>
      )}

      {profile && (
        <>
          {/* TARJETA DE BINANCE */}
          <section style={{
            background: `linear-gradient(135deg, ${BINANCE}14, var(--surface) 55%)`,
            border: `1px solid ${BINANCE}40`, borderRadius: 'var(--radius-lg)',
            padding: isMobile ? '16px' : '22px',
            display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: isMobile ? '16px' : '24px',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: BINANCE, fontWeight: 600, letterSpacing: '1px', marginBottom: '6px' }}>
                SALDO EN BINANCE · {currency}
              </div>
              <div style={{ fontSize: isMobile ? '30px' : '36px', fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1.1, color: profile.balance < 0 ? 'var(--red)' : 'var(--text)' }}>
                {formatMoney(profile.balance, currency)}
              </div>
              <div style={{ display: 'flex', gap: '18px', marginTop: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Apartado en metas</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{formatMoney(allocated, currency)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Libre</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: available < 0 ? 'var(--red)' : 'var(--cyan)' }}>{formatMoney(available, currency)}</div>
                </div>
              </div>
              {available < 0 && (
                <div style={{ fontSize: '11px', color: 'var(--amber)', marginTop: '8px', lineHeight: 1.45 }}>
                  Tienes más apartado en metas que saldo registrado. Ajusta tu saldo si depositaste dinero.
                </div>
              )}
              <button onClick={() => setBalanceOpen(true)} style={{
                marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                background: BINANCE, border: 'none', color: '#0A0E1A', fontSize: '12px', fontWeight: 700,
              }}>
                <Wallet size={14} /> Ajustar saldo
              </button>
            </div>

            <div style={{
              background: '#0A0E1A88', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, overflowWrap: 'anywhere' }}>
                  {profile.first_name} {profile.last_name}
                </div>
                <button onClick={() => setEditProfile(true)} title="Editar datos de Binance" aria-label="Editar datos de Binance" style={{
                  width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', flexShrink: 0, cursor: 'pointer',
                  background: `${BINANCE}12`, border: `1px solid ${BINANCE}40`, color: BINANCE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <UserCog size={14} />
                </button>
              </div>
              {profile.binance_uid && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)' }}>
                  <IdCard size={13} /> ID <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{profile.binance_uid}</span>
                </div>
              )}
              {profile.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', overflowWrap: 'anywhere' }}>
                  <Mail size={13} style={{ flexShrink: 0 }} /> {profile.email}
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 'auto', lineHeight: 1.4 }}>
                Saldo registrado por ti · actualizado {new Date(profile.updated_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          </section>

          {/* METAS EN CURSO */}
          <section>
            <SectionTitle title="Ahorrando" count={active.length} />
            {active.length === 0 ? (
              <div style={{
                padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
                  Crea tu primera meta de ahorro. Por ejemplo:
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {EXAMPLES.map(ex => (
                    <button key={ex.title} onClick={() => setGoalForm({ preset: ex })} style={{
                      padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px',
                      background: '#1a1a2e', border: '1px solid var(--border)', color: 'var(--text)',
                    }}>
                      {ex.icon} {ex.title} · <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{formatMoney(ex.amount, currency)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <Grid isMobile={isMobile}>
                {active.map(g => (
                  <SavingsGoalCard
                    key={g.id} goal={g} currency={currency}
                    onContribute={() => setContribute(g)}
                    onWithdraw={() => setAchieved({ goal: g, celebrate: false })}
                    onEdit={() => setGoalForm({ goal: g })}
                    onDelete={() => handleDeleteGoal(g)}
                    onDeleteContribution={id => handleDeleteContribution(g, id)}
                  />
                ))}
              </Grid>
            )}
          </section>

          {/* METAS LOGRADAS */}
          {finished.length > 0 && (
            <section>
              <SectionTitle title="Logradas" count={finished.length} />
              <Grid isMobile={isMobile}>
                {finished.map(g => (
                  <SavingsGoalCard
                    key={g.id} goal={g} currency={currency}
                    onContribute={() => setContribute(g)}
                    onWithdraw={() => setAchieved({ goal: g, celebrate: false })}
                    onEdit={() => setGoalForm({ goal: g })}
                    onDelete={() => handleDeleteGoal(g)}
                    onDeleteContribution={id => handleDeleteContribution(g, id)}
                  />
                ))}
              </Grid>
            </section>
          )}

          {/* MOVIMIENTOS DEL SALDO */}
          {data && data.moves.length > 0 && (
            <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: isMobile ? '14px' : '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <History size={14} color={BINANCE} />
                <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, letterSpacing: '0.8px' }}>MOVIMIENTOS DEL SALDO</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.moves.map((m, i) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  }}>
                    <span style={{
                      width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: m.delta >= 0 ? '#00FF8815' : '#FF386015',
                      color: m.delta >= 0 ? 'var(--green)' : 'var(--red)',
                    }}>
                      {m.delta >= 0 ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', lineHeight: 1.35, overflowWrap: 'anywhere' }}>{m.reason}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {new Date(m.created_at).toLocaleString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' · saldo '}{formatMoney(m.balance_after, currency)}
                      </div>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', color: m.delta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {m.delta >= 0 ? '+' : '−'}{formatMoney(Math.abs(m.delta), currency)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* AVISO */}
      {notice && (
        <div role="status" style={{
          position: 'fixed', left: '50%', bottom: isMobile ? '76px' : '24px', transform: 'translateX(-50%)', zIndex: 10001,
          padding: '10px 18px', borderRadius: '20px', fontSize: '13px',
          background: 'var(--surface)', border: '1px solid #00FF8855', color: 'var(--text)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)', maxWidth: 'calc(100vw - 32px)',
        }}>
          {notice}
        </div>
      )}

      {/* VENTANAS */}
      {editProfile && profile && (
        <Modal title="Datos de Binance" icon={<UserCog size={17} />} color={BINANCE} onClose={() => setEditProfile(false)} maxWidth={560}>
          <BinanceProfileForm userId={userId} profile={profile} onSaved={handleProfileSaved} onCancel={() => setEditProfile(false)} />
        </Modal>
      )}
      {goalForm && (
        <SavingsGoalModal
          goal={goalForm.goal} preset={goalForm.preset} currency={currency}
          usedColors={goals.filter(g => g.id !== goalForm.goal?.id).map(g => g.color)}
          onSubmit={handleGoalSubmit} onClose={() => setGoalForm(null)}
        />
      )}
      {contribute && (
        <ContributeModal
          goal={contribute} currency={currency} available={available}
          onSubmit={v => handleContribute(contribute, v)} onClose={() => setContribute(null)}
        />
      )}
      {achieved && (
        <GoalAchievedModal
          goal={achieved.goal} currency={currency} xp={SAVINGS_GOAL_XP} celebrate={achieved.celebrate}
          onWithdraw={amount => handleWithdraw(achieved.goal, amount)}
          onKeep={() => setAchieved(null)}
        />
      )}
      {balanceOpen && profile && (
        <BalanceModal balance={profile.balance} currency={currency} onSubmit={handleBalance} onClose={() => setBalanceOpen(false)} />
      )}
    </div>
  )
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <h2 style={{
      display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 12px',
      fontSize: '12px', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.8px', textTransform: 'uppercase',
    }}>
      {title}
      <span style={{ fontWeight: 400, letterSpacing: 0, color: '#64748B' }}>· {count}</span>
      <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </h2>
  )
}

function Grid({ isMobile, children }: { isMobile: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gap: '12px',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
    }}>
      {children}
    </div>
  )
}
