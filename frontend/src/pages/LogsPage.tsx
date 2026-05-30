import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { PageContainer } from '../components/PageContainer'
import { Button } from '../components/ui'
import { logsApi, type LogEntry } from '../api/logs'
import { EventsOn } from '../../wailsjs/runtime/runtime'

function levelClass(level: string): string {
  switch (level) {
    case 'error':
    case 'fatal':
    case 'panic':
      return 'text-rose-300'
    case 'warn':
      return 'text-amber-300'
    case 'debug':
    case 'trace':
      return 'text-slate-500'
    default:
      return 'text-slate-300'
  }
}

export function LogsPage() {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsApi.getLogs().then(setEntries)
    const off = EventsOn('log:entry', (e: LogEntry) => {
      setEntries((prev) => {
        const next = [...prev, e]
        return next.length > 500 ? next.slice(-500) : next
      })
    })
    return off
  }, [])

  // Auto-scroll to bottom when new entries arrive (unless user scrolled up).
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  }, [entries, autoScroll])

  const onScroll = () => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setAutoScroll(atBottom)
  }

  return (
    <PageContainer
      title={t('logs.title')}
      actions={
        <Button variant="ghost" onClick={() => setEntries([])}>
          {t('logs.clear')}
        </Button>
      }
    >
      <div
        ref={containerRef}
        onScroll={onScroll}
        dir="ltr"
        className="h-[calc(100vh-148px)] overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3"
      >
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            {t('logs.empty')}
          </div>
        ) : (
          <div className="space-y-0.5 font-mono text-xs">
            {entries.map((e, i) => (
              <div key={i} className="flex min-w-0 gap-3">
                <span className={clsx('w-10 shrink-0 uppercase', levelClass(e.level))}>
                  {e.level.slice(0, 4)}
                </span>
                <span className={clsx('break-all', levelClass(e.level))}>{e.message}</span>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </PageContainer>
  )
}
