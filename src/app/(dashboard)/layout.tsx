import Sidebar from '@/components/layout/Sidebar'
import XPBar from '@/components/gamification/XPBar'
import LevelUpModal from '@/components/gamification/LevelUpModal'
import XPToast from '@/components/gamification/XPToast'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <Sidebar />
        </div>
        <XPBar />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {children}
      </div>
      <LevelUpModal />
      <XPToast />
    </div>
  )
}