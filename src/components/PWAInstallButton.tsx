'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showButton,     setShowButton]     = useState(false)
  const [installing,     setInstalling]     = useState(false)
  const [installed,      setInstalled]      = useState(false)

  useEffect(() => {
    // Detecta si ya está instalada
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isInstalled) {
      setInstalled(true)
      return
    }

    // Captura el evento de instalación
    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowButton(true)
    }

    // Detecta cuando ya se instaló
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      if (e.matches) {
        setInstalled(true)
        setShowButton(false)
      }
    })

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
      setShowButton(false)
    }
    setDeferredPrompt(null)
    setInstalling(false)
  }

  // No muestra nada si ya está instalada o si no hay prompt disponible
  if (installed || !showButton) return null

  return (
    <>
      <button
        onClick={handleInstall}
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 24px',
          background: 'linear-gradient(135deg, #00F5FF, #B026FF)',
          border: 'none',
          borderRadius: '30px',
          color: '#0A0E1A',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,245,255,0.4), 0 0 0 1px rgba(0,245,255,0.2)',
          fontFamily: 'Inter, sans-serif',
          whiteSpace: 'nowrap',
          animation: 'pwa-bounce 2s ease-in-out infinite',
        }}
      >
        <Download size={18} />
        {installing ? 'Instalando...' : 'Instalar KronoMeta'}
      </button>

      <style>{`
        @keyframes pwa-bounce {
          0%,100% { transform: translateX(-50%) translateY(0px); box-shadow: 0 8px 32px rgba(0,245,255,0.4); }
          50%      { transform: translateX(-50%) translateY(-4px); box-shadow: 0 16px 40px rgba(0,245,255,0.6); }
        }
        @media (min-width: 1024px) {
          .pwa-install-btn { display: none !important; }
        }
      `}</style>
    </>
  )
}