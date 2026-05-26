'use client'

import dynamic from 'next/dynamic'
import { DiaryEntry } from '@/lib/diary'

interface Props {
  entry?: DiaryEntry
  date: string
  timezone: string
  userId: string
  onSave: (entry: DiaryEntry) => void
  onCancel: () => void
}

const DiaryEditor = dynamic(
  () => import('./DiaryEditor').catch(() => {
    const Fallback = ({ onCancel }: { onCancel: () => void }) => (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: '16px', color: '#94A3B8',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ fontSize: '14px' }}>Error al cargar el editor</div>
        <button onClick={onCancel} style={{
          padding: '8px 16px', background: '#1F2937',
          border: 'none', borderRadius: '8px',
          color: '#fff', cursor: 'pointer',
        }}>Volver</button>
      </div>
    )
    return { default: Fallback }
  }),
  {
    ssr: false,
    loading: () => (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#374151',
        fontFamily: 'JetBrains Mono, monospace', fontSize: '13px',
        background: '#0A0E1A',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: '2px solid #1F2937', borderTopColor: '#00F5FF',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span>cargando editor...</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    ),
  }
)

export default function DiaryEditorWrapper(props: Props) {
  return <DiaryEditor {...props} />
}