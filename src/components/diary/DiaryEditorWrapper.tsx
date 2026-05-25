'use client'

import dynamic from 'next/dynamic'
import { DiaryEntry } from '@/lib/diary'

const DiaryEditor = dynamic(() => import('./DiaryEditor'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: '#374151',
      fontFamily: 'var(--font-mono)', fontSize: '13px',
    }}>
      cargando editor...
    </div>
  ),
})

interface Props {
  entry?: DiaryEntry
  date: string
  timezone: string
  userId: string
  onSave: (entry: DiaryEntry) => void
  onCancel: () => void
}

export default function DiaryEditorWrapper(props: Props) {
  return <DiaryEditor {...props} />
}