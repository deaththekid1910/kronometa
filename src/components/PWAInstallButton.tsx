'use client'

import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled,    setIsInstalled]    = useState(false)
  const [isMobile,       setIsMobile]       = useState(false)
  const [showManual,     setShowManual]     = useState(false)
  const [dismissed,      setDismissed]      = useState(false)
  const [installing,     setInstalling]     = useState(false)

  useEffect(() => {
    // Detecta móvil
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    setIsMobile(mobile)

    // Detecta si ya está instalada como standalone
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsInstalled(standalone)

    // Detecta si ya la instaló antes
    const wasDismissed = localStorage.getItem('pwa-dismissed') === 'true'
    setDismissed(wasDismissed)

    // Captura el prompt nativo de Chrome
    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // Detecta instalación exitosa
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      localStorage.setItem('pwa-dismissed', 'true')
    })

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  async function handleInstall() {
    if (deferredPrompt) {
      // Tiene prompt nativo — úsalo
      setInstalling(true)
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
        localStorage.setItem('pwa-dismissed', 'true')
      }
      setDeferredPrompt(null)
      setInstalling(false)
    } else {
      // Sin prompt nativo — muestra instrucciones manuales
      setShowManual(true)
    }
  }

  function handleDismiss() {
    localStorage.setItem('pwa-dismissed', 'true')
    setDismissed(true)
    setShowManual(false)
  }

  // No mostrar si: ya instalada, ya descartó, o es desktop
  if (isInstalled || dismissed || !isMobile) return null

  return (
    <>
      {/* BOTÓN PRINCIPAL */}
      <div style={{
        position: 'fixed',
        bottom: '72px',
        left: '12px',
        right: '12px',
        zIndex: 9999,
        animation: 'pwa-slide-up 0.4s ease forwards',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0d1428, #131829)',
          border: '1px solid #00F5FF44',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 40px rgba(0,245,255,0.25), 0 0 0 1px rgba(0,245,255,0.1)',
        }}>
          {/* ICONO APP */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #00F5FF22, #B026FF22)',
            border: '1px solid #00F5FF44',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Smartphone size={22} color="#00F5FF" />
          </div>

          {/* TEXTO */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9', marginBottom: '2px' }}>
              Instalar KronoMeta
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Accede más rápido desde tu teléfono
            </div>
          </div>

          {/* BOTÓN INSTALAR */}
          <button
            onClick={handleInstall}
            disabled={installing}
            style={{
              padding: '8px 16px',
              background: '#00F5FF',
              border: 'none',
              borderRadius: '10px',
              color: '#0A0E1A',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 0 16px #00F5FF66',
              transition: 'all 0.2s',
            }}
          >
            {installing ? '...' : 'Instalar'}
          </button>

          {/* CERRAR */}
          <button
            onClick={handleDismiss}
            style={{
              background: 'none', border: 'none',
              color: '#374151', cursor: 'pointer',
              padding: '4px', flexShrink: 0,
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* MODAL INSTRUCCIONES MANUALES */}
      {showManual && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex', alignItems: 'flex-end',
          padding: '0',
        }}
          onClick={() => setShowManual(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              background: '#131829',
              border: '1px solid #1F2937',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px 40px',
              animation: 'sheet-up 0.3s ease',
            }}
          >
            <div style={{ width: '40px', height: '4px', background: '#374151', borderRadius: '2px', margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #00F5FF, #B026FF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', flexShrink: 0,
              }}>⬡</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#F1F5F9' }}>Instalar KronoMeta</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Sigue estos pasos en Chrome</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {[
                { num: '1', text: 'Toca los 3 puntos ⋮ arriba a la derecha de Chrome' },
                { num: '2', text: 'Selecciona "Añadir a pantalla de inicio"' },
                { num: '3', text: 'Toca "Añadir" en el popup que aparece' },
                { num: '4', text: '¡Listo! KronoMeta aparece en tu pantalla de inicio' },
              ].map(s => (
                <div key={s.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: '#00F5FF15', border: '1px solid #00F5FF33',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#00F5FF',
                  }}>{s.num}</div>
                  <div style={{ fontSize: '14px', color: '#94A3B8', paddingTop: '4px', lineHeight: 1.5 }}>
                    {s.text}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowManual(false)}
              style={{
                width: '100%', padding: '14px',
                background: '#00F5FF', border: 'none',
                borderRadius: '12px', color: '#0A0E1A',
                fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pwa-slide-up {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes sheet-up {
          from { transform:translateY(100%); }
          to   { transform:translateY(0); }
        }
      `}</style>
    </>
  )
}