import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Cable, Server, Globe, Network, ScrollText, Settings as SettingsIcon } from 'lucide-react'
import { useAppStore, type Page } from './store/useAppStore'
import { useServers } from './store/useServers'
import { useConnection } from './store/useConnection'
import { StatusPill } from './components/StatusPill'
import { Modal, Button } from './components/ui'
import { ConnectionPage } from './pages/ConnectionPage'
import { ServersPage } from './pages/ServersPage'
import { ProxyPage } from './pages/ProxyPage'
import { TunPage } from './pages/TunPage'
import { LogsPage } from './pages/LogsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TrafficBar } from './components/TrafficBar'
import { EventsOn } from '../wailsjs/runtime/runtime'
import { type PingResult } from './api/servers'
import { type ConnStatus } from './api/connection'
import { windowApi } from './api/window'

const navItems: { id: Page; icon: typeof Server }[] = [
  { id: 'connection', icon: Cable },
  { id: 'servers', icon: Server },
  { id: 'proxy', icon: Globe },
  { id: 'tun', icon: Network },
  { id: 'logs', icon: ScrollText },
  { id: 'settings', icon: SettingsIcon },
]

function App() {
  const { t } = useTranslation()
  const page = useAppStore((s) => s.page)
  const setPage = useAppStore((s) => s.setPage)
  const [closePrompt, setClosePrompt] = useState(false)

  useEffect(() => {
    useConnection.getState().init()

    const offPing = EventsOn('ping:update', (r: PingResult) => useServers.getState().setPing(r))
    const offStatus = EventsOn('status:change', (s: ConnStatus) =>
      useConnection.getState().setStatus(s),
    )
    const offClose = EventsOn('close:requested', () => setClosePrompt(true))
    return () => {
      offPing()
      offStatus()
      offClose()
    }
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-e border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/20 text-brand-300">
            <Network size={20} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold leading-tight">{t('app.name')}</div>
            <div className="truncate text-[11px] text-slate-400">{t('app.tagline')}</div>
          </div>
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {navItems.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                page === id
                  ? 'bg-brand-500/15 text-brand-200'
                  : 'text-slate-300 hover:bg-slate-800/60',
              )}
            >
              <Icon size={18} className="shrink-0" />
              {t(`nav.${id}`)}
            </button>
          ))}
        </nav>

        <div className="p-3">
          <StatusPill />
        </div>
      </aside>

      {/* Main content + traffic bar */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {page === 'connection' && <ConnectionPage />}
          {page === 'servers' && <ServersPage />}
          {page === 'proxy' && <ProxyPage />}
          {page === 'tun' && <TunPage />}
          {page === 'logs' && <LogsPage />}
          {page === 'settings' && <SettingsPage />}
        </main>
        <TrafficBar />
      </div>

      {/* Close-to-tray prompt */}
      <Modal open={closePrompt} onClose={() => setClosePrompt(false)} title={t('quit.title')}>
        <p className="text-sm text-slate-300">{t('quit.message')}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setClosePrompt(false)
              windowApi.hideToTray()
            }}
          >
            {t('quit.minimize')}
          </Button>
          <Button variant="danger" onClick={() => windowApi.quit()}>
            {t('quit.quit')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default App
