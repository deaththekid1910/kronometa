import Sidebar from '@/components/layout/Sidebar'
import XPBar from '@/components/gamification/XPBar'
import LevelUpModal from '@/components/gamification/LevelUpModal'
import XPToast from '@/components/gamification/XPToast'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'row',
      minHeight: '100vh', background: 'var(--bg)',
    }}>
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

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0, overflowY: 'auto', height: '100vh',
      }}>
        {children}
      </div>

      <LevelUpModal />
      <XPToast />
    </div>
  )
}