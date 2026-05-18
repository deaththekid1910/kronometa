'use client'

import { useXPStore } from '@/store/xpStore'
import { getLevelInfo } from '@/lib/gamification'

export default function LevelUpModal() {
  const { showLevelUp, levelInfo, previousLevel, closeLevelUp } = useXPStore()
  if (!showLevelUp) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(6px)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={closeLevelUp}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', border: '1px solid #B026FF66',
          borderRadius: '20px', padding: '40px 32px', textAlign: 'center',
          maxWidth: '360px', width: '100%',
          boxShadow: '0 0 60px #B026FF44, 0 0 120px #00F5FF22',
          animation: 'levelup 0.4s ease',
        }}
      >
        <style>{`
          @keyframes levelup {
            from { transform: scale(0.8); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
          }
          @keyframes glow-pulse {
            0%,100% { box-shadow: 0 0 20px #B026FF88; }
            50%      { box-shadow: 0 0 40px #B026FFcc, 0 0 80px #00F5FF44; }
          }
        `}</style>

        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--purple), var(--cyan))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          animation: 'glow-pulse 2s infinite',
        }}>
          <span style={{ fontSize: '36px' }}>⭐</span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--purple)', letterSpacing: '2px', marginBottom: '8px', fontWeight: 500 }}>
          ¡SUBISTE DE NIVEL!
        </div>

        <div style={{ fontSize: '48px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
          <span style={{ color: 'var(--muted)', fontSize: '28px' }}>{previousLevel} → </span>
          <span style={{
            background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{levelInfo.level}</span>
        </div>

        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
          {levelInfo.title}
        </div>

        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '28px' }}>
          Siguiente nivel en {levelInfo.xpForNext} XP
        </div>

        <button onClick={closeLevelUp} style={{
          padding: '11px 32px', background: 'linear-gradient(135deg, var(--purple), var(--cyan))',
          border: 'none', borderRadius: '30px', color: '#0A0E1A',
          fontSize: '14px', fontWeight: 700, cursor: 'pointer',
        }}>
          ¡Seguir adelante!
        </button>
      </div>
    </div>
  )
}