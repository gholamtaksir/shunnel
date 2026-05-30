import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Power, Loader2, Globe, Network } from 'lucide-react'
import clsx from 'clsx'
import { PageContainer } from '../components/PageContainer'
import { Dropdown } from '../components/Dropdown'
import { Button } from '../components/ui'
import { useServers } from '../store/useServers'
import { useConnection } from '../store/useConnection'
import { useTun } from '../store/useTun'

type ConnMode = 'proxy' | 'tun'

export function ConnectionPage() {
  const { t } = useTranslation()
  const { servers, load: loadServers } = useServers()
  const { status, busy, connect, disconnect, proxy, loadProxy, saveProxy } = useConnection()
  const { tun, isAdmin, load: loadTun, save: saveTun, restartAsAdmin } = useTun()
  const [selection, setSelection] = useState('auto')

  useEffect(() => {
    loadServers()
    loadProxy()
    loadTun()
  }, [])

  // Keep dropdown in sync with active connection.
  useEffect(() => {
    if (status.state === 'connected' && status.serverId) {
      setSelection(status.serverId)
    }
  }, [status.state, status.serverId])

  const connected = status.state === 'connected'
  const connecting = status.state === 'connecting'

  // Mode is derived from tun.enabled; no separate state needed.
  const mode: ConnMode = tun?.enabled ? 'tun' : 'proxy'

  const handleToggle = async () => {
    if (connected || connecting) {
      await disconnect()
    } else {
      await connect(selection)
    }
  }

  const handleModeChange = async (newMode: ConnMode) => {
    if (newMode === 'tun' && !isAdmin) {
      await restartAsAdmin()
      return
    }
    if (!tun || newMode === mode) return
    const wasConnected = connected
    const currentId = status.serverId || selection
    await saveTun({ ...tun, enabled: newMode === 'tun' })
    if (wasConnected) {
      await disconnect()
      await connect(currentId)
    }
  }

  const toggleSysProxy = async () => {
    if (!proxy) return
    const wasConnected = connected
    const currentId = status.serverId || selection
    await saveProxy({ ...proxy, setSystemProxy: !proxy.setSystemProxy })
    if (wasConnected) {
      await disconnect()
      await connect(currentId)
    }
  }

  const isSocks = proxy?.protocol === 'socks'

  const serverOptions = [
    { value: 'auto', label: t('servers.auto') },
    ...servers.map((s) => ({ value: s.id, label: s.name || s.host })),
  ]

  return (
    <PageContainer title={t('connection.title')}>
      <div className="mx-auto max-w-sm space-y-5">
        {/* Server selector */}
        <div>
          <div className="mb-1 text-xs font-medium text-slate-400">{t('connection.server')}</div>
          <Dropdown
            value={selection}
            options={serverOptions}
            onChange={setSelection}
            disabled={connected || connecting}
          />
        </div>

        {/* Mode selector */}
        <div>
          <div className="mb-2 text-xs font-medium text-slate-400">Mode</div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                {
                  key: 'proxy' as ConnMode,
                  icon: Globe,
                  label: t('connection.modeProxy'),
                  desc: t('connection.modeProxyDesc'),
                },
                {
                  key: 'tun' as ConnMode,
                  icon: Network,
                  label: t('connection.modeTun'),
                  desc: t('connection.modeTunDesc'),
                },
              ] as const
            ).map(({ key, icon: Icon, label, desc }) => (
              <button
                key={key}
                type="button"
                disabled={busy}
                onClick={() => handleModeChange(key)}
                className={clsx(
                  'flex flex-col items-start gap-1 rounded-xl border p-3 text-start transition disabled:cursor-not-allowed disabled:opacity-40',
                  mode === key
                    ? 'border-brand-500/60 bg-brand-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600',
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    size={16}
                    className={mode === key ? 'text-brand-300' : 'text-slate-400'}
                  />
                  <span
                    className={clsx(
                      'text-sm font-medium',
                      mode === key ? 'text-brand-200' : 'text-slate-200',
                    )}
                  >
                    {label}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{desc}</span>
                {key === 'tun' && !isAdmin && (
                  <span className="text-xs text-amber-400/80">{t('tun.adminNote')}</span>
                )}
              </button>
            ))}
          </div>


          {/* System proxy (proxy mode only) */}
          {mode === 'proxy' && (
            <div className="mt-3 space-y-1">
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={proxy?.setSystemProxy ?? false}
                  disabled={isSocks || busy}
                  onChange={toggleSysProxy}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-brand-500 disabled:opacity-40"
                />
                {t('proxy.setSystemProxy')}
              </label>
              {isSocks && (
                <p className="ms-6 text-xs text-slate-500">{t('proxy.socksNote')}</p>
              )}
            </div>
          )}
        </div>

        {/* Connect / Disconnect */}
        <button
          onClick={handleToggle}
          disabled={busy}
          className={clsx(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50',
            connected
              ? 'bg-rose-500/90 text-white hover:bg-rose-500'
              : 'bg-brand-500 text-white hover:bg-brand-400',
          )}
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Power size={18} />
          )}
          {connecting
            ? t('common.connecting')
            : connected
              ? t('common.disconnect')
              : t('common.connect')}
        </button>

        {status.state === 'error' && status.error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {status.error}
          </p>
        )}
      </div>
    </PageContainer>
  )
}
