import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import { type PingState } from '../store/useServers'

export function PingBadge({ ping }: { ping?: PingState }) {
  if (!ping) {
    return <span className="text-xs text-slate-500">—</span>
  }
  if (ping.loading) {
    return <Loader2 size={14} className="animate-spin text-slate-400" />
  }
  if (!ping.ok) {
    return (
      <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-300">
        ✕
      </span>
    )
  }
  const tone =
    ping.ms < 150
      ? 'text-emerald-300 bg-emerald-500/15'
      : ping.ms < 400
        ? 'text-amber-300 bg-amber-500/15'
        : 'text-rose-300 bg-rose-500/15'
  return (
    <span className={clsx('rounded-md px-2 py-0.5 text-xs font-medium tabular-nums', tone)}>
      {ping.ms} ms
    </span>
  )
}
