'use client'

interface Props {
  color: string
  size?: number
  animate?: boolean
  direction?: 'right' | 'left'
}

export default function AvatarCharacter({ color, size = 48, animate = true, direction = 'right' }: Props) {
  const s = size
  const flip = direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'

  return (
    <div style={{
      width: s, height: s,
      position: 'relative',
      transform: flip,
      animation: animate ? 'avatar-float 2s ease-in-out infinite' : 'none',
      filter: `drop-shadow(0 0 ${s * 0.2}px ${color}99)`,
    }}>
      <style>{`
        @keyframes avatar-float {
          0%,100% { transform: ${flip} translateY(0px); }
          50%      { transform: ${flip} translateY(-4px); }
        }
        @keyframes avatar-run {
          0%,100% { transform: ${flip} translateY(0px) rotate(-1deg); }
          50%      { transform: ${flip} translateY(-3px) rotate(1deg); }
        }
      `}</style>
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* GLOW */}
        <circle cx="24" cy="40" r="8" fill={color} fillOpacity="0.15" />

        {/* CAPA / CABO */}
        <path d="M16 28 Q12 32 13 38 Q16 36 18 34Z" fill={color} fillOpacity="0.6" />

        {/* CUERPO */}
        <rect x="17" y="24" width="14" height="14" rx="4" fill={color} fillOpacity="0.9" />

        {/* PECHO — detalle */}
        <rect x="20" y="26" width="8" height="5" rx="2" fill="#0A0E1A" fillOpacity="0.4" />
        <rect x="21" y="27" width="6" height="3" rx="1" fill={color} fillOpacity="0.5" />

        {/* PIERNAS */}
        <rect x="18" y="36" width="5" height="7" rx="2" fill={color} fillOpacity="0.8" />
        <rect x="25" y="36" width="5" height="7" rx="2" fill={color} fillOpacity="0.8" />

        {/* BOTAS */}
        <rect x="17" y="41" width="7" height="3" rx="1.5" fill="#0A0E1A" fillOpacity="0.7" />
        <rect x="24" y="41" width="7" height="3" rx="1.5" fill="#0A0E1A" fillOpacity="0.7" />

        {/* BRAZOS */}
        <rect x="12" y="25" width="5" height="10" rx="2.5" fill={color} fillOpacity="0.8" />
        <rect x="31" y="25" width="5" height="10" rx="2.5" fill={color} fillOpacity="0.8" />

        {/* ESPADA */}
        <rect x="33" y="16" width="2.5" height="14" rx="1" fill="#94A3B8" />
        <rect x="31" y="22" width="7" height="2" rx="1" fill="#64748B" />
        <rect x="33.5" y="14" width="1.5" height="4" rx="0.75" fill={color} />

        {/* CABEZA */}
        <circle cx="24" cy="16" r="9" fill={color} fillOpacity="0.95" />

        {/* VISOR / CASCO */}
        <path d="M15 14 Q15 7 24 7 Q33 7 33 14 L33 12 Q33 6 24 6 Q15 6 15 12Z" fill="#0A0E1A" fillOpacity="0.5" />

        {/* OJOS */}
        <rect x="19" y="14" width="4" height="3" rx="1.5" fill="#0A0E1A" />
        <rect x="25" y="14" width="4" height="3" rx="1.5" fill="#0A0E1A" />
        <rect x="19.5" y="14.5" width="3" height="2" rx="1" fill={color} fillOpacity="0.8" />
        <rect x="25.5" y="14.5" width="3" height="2" rx="1" fill={color} fillOpacity="0.8" />

        {/* ANTENA / DETALLE CASCO */}
        <rect x="23" y="5" width="2" height="4" rx="1" fill={color} fillOpacity="0.7" />
        <circle cx="24" cy="4.5" r="1.5" fill={color} />

        {/* BRILLO CASCO */}
        <path d="M17 12 Q20 9 24 9" stroke="white" strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round" />
      </svg>
    </div>
  )
}