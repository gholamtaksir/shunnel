import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Power, Loader2 } from 'lucide-react'

interface Props {
  connected: boolean
  busy: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export function ConnectButton({ connected, busy, onConnect, onDisconnect }: Props) {
  const { t } = useTranslation()
  return (
    <button
      onClick={connected ? onDisconnect : onConnect}
      disabled={busy}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50',
        connected
          ? 'bg-rose-500/90 text-white hover:bg-rose-500'
          : 'bg-brand-500 text-white hover:bg-brand-400',
      )}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
      {connected ? t('common.disconnect') : t('common.connect')}
    </button>
  )
}
