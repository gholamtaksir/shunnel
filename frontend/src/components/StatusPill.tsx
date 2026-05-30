import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { useConnection } from '../store/useConnection'

export function StatusPill() {
  const { t } = useTranslation()
  const status = useConnection((s) => s.status)

  const map = {
    connected: { dot: 'bg-emerald-400', label: t('common.connected') },
    connecting: { dot: 'bg-amber-400 animate-pulse', label: t('common.connecting') },
    error: { dot: 'bg-rose-400', label: t('common.disconnected') },
    disconnected: { dot: 'bg-slate-500', label: t('common.disconnected') },
  } as const

  const s = map[status.state as keyof typeof map] ?? map.disconnected

  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2 text-xs">
      <span className={clsx('h-2 w-2 rounded-full', s.dot)} />
      <span className="text-slate-300">{s.label}</span>
    </div>
  )
}
