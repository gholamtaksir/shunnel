import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { Button, TextInput, Field } from '../components/ui'
import { Dropdown } from '../components/Dropdown'
import { useConnection } from '../store/useConnection'
import { type ProxySettings } from '../api/connection'

export function ProxyPage() {
  const { t } = useTranslation()
  const { proxy, endpoint, loadProxy, saveProxy, status } = useConnection()
  const [form, setForm] = useState<ProxySettings | null>(proxy)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!proxy) loadProxy()
  }, [proxy, loadProxy])
  useEffect(() => {
    setForm(proxy)
  }, [proxy])

  if (!form) {
    return (
      <PageContainer title={t('proxy.title')}>
        <div className="text-slate-400">…</div>
      </PageContainer>
    )
  }

  const set = <K extends keyof ProxySettings>(k: K, v: ProxySettings[K]) =>
    setForm({ ...form, [k]: v } as ProxySettings)

  const save = async () => {
    await saveProxy(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const showAuthWarn = form.bindScope === 'all' && !form.authEnabled
  const connected = status.state === 'connected'

  return (
    <PageContainer title={t('proxy.title')}>
      <div className="space-y-4">
        <Field label={t('proxy.protocol')}>
          <Dropdown
            value={form.protocol}
            onChange={(v) => set('protocol', v)}
            options={[
              { value: 'mixed', label: t('proxy.mixed') },
              { value: 'socks', label: t('proxy.socks') },
              { value: 'http', label: t('proxy.http') },
            ]}
          />
        </Field>

        <div className="flex gap-3">
          <div className="flex-1">
            <Field label={t('proxy.bind')}>
              <Dropdown
                value={form.bindScope}
                onChange={(v) => set('bindScope', v)}
                options={[
                  { value: 'local', label: t('proxy.bindLocal') },
                  { value: 'lan', label: t('proxy.bindLan') },
                  { value: 'all', label: t('proxy.bindAll') },
                ]}
              />
            </Field>
          </div>
          <div className="w-28">
            <Field label={t('proxy.port')}>
              <TextInput
                type="number"
                value={form.port}
                onChange={(e) => set('port', Number(e.target.value))}
              />
            </Field>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={form.authEnabled}
            onChange={(e) => set('authEnabled', e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-brand-500"
          />
          {t('proxy.auth')}
        </label>

        {form.authEnabled && (
          <div className="flex gap-3">
            <div className="flex-1">
              <Field label={t('proxy.username')}>
                <TextInput value={form.username} onChange={(e) => set('username', e.target.value)} />
              </Field>
            </div>
            <div className="flex-1">
              <Field label={t('proxy.password')}>
                <TextInput
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}

        {showAuthWarn && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{t('proxy.bindAllWarning')}</span>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 px-4 py-3">
          <div>
            <div className="text-xs text-slate-400">{t('proxy.bind')}</div>
            <div className="font-mono text-sm tabular-nums">{endpoint || '—'}</div>
          </div>
          {connected && (
            <span className="flex items-center gap-1 text-xs text-emerald-300">
              <ShieldCheck size={14} />
              {t('common.connected')}
            </span>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <span className="text-xs text-slate-500">{t('proxy.applyHint')}</span>
          <Button onClick={save}>{saved ? '✓' : t('common.save')}</Button>
        </div>
      </div>
    </PageContainer>
  )
}
