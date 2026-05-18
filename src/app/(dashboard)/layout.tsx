'use client'

import { useBreakpoint } from '@/hooks/useBreakpoint'
import Sidebar from '@/components/layout/Sidebar'
import XPBar from '@/components/gamification/XPBar'
import LevelUpModal from '@/components/gamification/LevelUpModal'
import XPToast from '@/components/gamification/XPToast'
import MobileNav from '@/components/layout/MobileNav'
import MobileBottomBar from '@/components/layout/MobileBottomBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const isDesktop = bp === 'desktop'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* SIDEBAR — solo desktop */}
      {isDesktop && (
        <div style={{
          width: '220px', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
        }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Sidebar />
          </div>
          <XPBar />
        </div>
      )}

      {/* NAV MÓVIL Y TABLET — topbar + drawer */}
      {(isMobile || isTablet) && <MobileNav />}

      {/* CONTENIDO PRINCIPAL */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0, overflowY: 'auto', height: '100vh',
        paddingTop: (isMobile || isTablet) ? '52px' : '0',
        paddingBottom: isMobile ? '60px' : '0',
      }}>
        {children}
      </div>

      {/* BOTTOM BAR — solo móvil */}
      {isMobile && <MobileBottomBar />}

      <LevelUpModal />
      <XPToast />
    </div>
  )
}