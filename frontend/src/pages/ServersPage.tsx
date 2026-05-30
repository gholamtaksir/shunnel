import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Plus, Radar, Zap } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { Button } from '../components/ui'
import { ServerCard } from '../components/ServerCard'
import { ServerForm } from '../components/ServerForm'
import { useServers } from '../store/useServers'
import { useConnection } from '../store/useConnection'
import { type ServerProfile, type ServerInput } from '../api/servers'

export function ServersPage() {
  const { t } = useTranslation()
  const { servers, pings, load, add, update, remove, pingOne, pingAll } = useServers()
  const { status } = useConnection()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ServerProfile | null>(null)

  useEffect(() => {
    load()
  }, [load])

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (s: ServerProfile) => {
    setEditing(s)
    setFormOpen(true)
  }
  const submit = async (p: ServerInput) => {
    if (editing) await update(p)
    else await add(p)
  }

  const autoConnected = status.state === 'connected' && status.serverId === 'auto'

  return (
    <PageContainer
      title={t('servers.title')}
      actions={
        <div className="flex gap-2">
          {servers.length > 0 && (
            <Button variant="ghost" onClick={pingAll}>
              <Radar size={16} />
              {t('servers.pingAll')}
            </Button>
          )}
          <Button onClick={openAdd}>
            <Plus size={16} />
            {t('servers.addServer')}
          </Button>
        </div>
      }
    >
      {servers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
          {t('servers.empty')}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Auto / failover */}
          <div
            className={clsx(
              'flex items-center gap-4 rounded-xl border px-4 py-3 transition',
              autoConnected
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-800 bg-slate-800/30',
            )}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-brand-300">
              <Zap size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-medium">
                {autoConnected && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                {t('servers.auto')}
              </div>
              <div className="truncate text-xs text-slate-400">{t('servers.autoDesc')}</div>
            </div>
          </div>

          {servers.map((s) => (
            <ServerCard
              key={s.id}
              server={s}
              ping={pings[s.id]}
              connected={status.state === 'connected' && status.serverId === s.id}
              onEdit={() => openEdit(s)}
              onDelete={() => remove(s.id)}
              onPing={() => pingOne(s.id)}
            />
          ))}
        </div>
      )}

      <ServerForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={submit}
        initial={editing}
      />
    </PageContainer>
  )
}
