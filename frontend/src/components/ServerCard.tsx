import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Pencil, Trash2, Activity } from 'lucide-react'
import { PingBadge } from './PingBadge'
import { type PingState } from '../store/useServers'
import { type ServerProfile } from '../api/servers'

interface Props {
  server: ServerProfile
  ping?: PingState
  connected: boolean
  onEdit: () => void
  onDelete: () => void
  onPing: () => void
}

export function ServerCard({ server, ping, connected, onEdit, onDelete, onPing }: Props) {
  const { t } = useTranslation()
  return (
    <div
      className={clsx(
        'flex items-center gap-4 rounded-xl border px-4 py-3 transition',
        connected ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-800 bg-slate-800/30',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {connected && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />}
          <span className="truncate font-medium">{server.name || server.host}</span>
        </div>
        <div className="truncate text-xs text-slate-400" dir="ltr">
          {server.user ? `${server.user}@` : ''}{server.host}:{server.port}
        </div>
      </div>

      <PingBadge ping={ping} />

      <div className="flex items-center gap-1">
        <button
          onClick={onPing}
          title={t('servers.ping')}
          className="rounded-md p-2 text-slate-400 transition hover:bg-slate-700 hover:text-slate-100"
        >
          <Activity size={16} />
        </button>
        <button
          onClick={onEdit}
          title={t('common.edit')}
          className="rounded-md p-2 text-slate-400 transition hover:bg-slate-700 hover:text-slate-100"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={onDelete}
          title={t('common.delete')}
          className="rounded-md p-2 text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-300"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
