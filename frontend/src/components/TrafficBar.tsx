import { useEffect, useState } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { EventsOn } from '../../wailsjs/runtime/runtime'

interface TrafficData {
  upTotal: number
  downTotal: number
  upRate: number
  downRate: number
}

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export function TrafficBar() {
  const [data, setData] = useState<TrafficData | null>(null)

  useEffect(() => {
    const off = EventsOn('traffic:update', (d: TrafficData) => {
      // Zero struct is emitted when the engine stops — treat as disconnected.
      if (d.upTotal === 0 && d.downTotal === 0 && d.upRate === 0 && d.downRate === 0) {
        setData(null)
      } else {
        setData(d)
      }
    })
    return off
  }, [])

  if (!data) return null

  return (
    <div className="flex shrink-0 items-center justify-end gap-4 border-t border-slate-800 bg-slate-950/60 px-5 py-1.5 text-xs">
      {/* Real-time rates */}
      <span className="flex items-center gap-1 tabular-nums">
        <ArrowUp size={11} className="text-emerald-400" />
        <span className="text-slate-300">{fmt(data.upRate)}/s</span>
      </span>
      <span className="flex items-center gap-1 tabular-nums">
        <ArrowDown size={11} className="text-sky-400" />
        <span className="text-slate-300">{fmt(data.downRate)}/s</span>
      </span>

      <span className="text-slate-700">|</span>

      {/* Session totals */}
      <span className="flex items-center gap-1 tabular-nums text-slate-500">
        <ArrowUp size={11} />
        {fmt(data.upTotal)}
      </span>
      <span className="flex items-center gap-1 tabular-nums text-slate-500">
        <ArrowDown size={11} />
        {fmt(data.downTotal)}
      </span>
    </div>
  )
}
