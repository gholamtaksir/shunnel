import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlert } from 'lucide-react'
import { PageContainer } from '../components/PageContainer'
import { Button, TextInput, Field } from '../components/ui'
import { Dropdown } from '../components/Dropdown'
import { ListEditor } from '../components/ListEditor'
import { AppPicker } from '../components/AppPicker'
import { useTun } from '../store/useTun'
import { type TunSettings } from '../api/tun'

export function TunPage() {
  const { t } = useTranslation()
  const { tun, isAdmin, load, save, restartAsAdmin } = useTun()
  const [form, setForm] = useState<TunSettings | null>(tun)
  const [saved, setSaved] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    setForm(tun)
  }, [tun])

  if (!form) {
    return (
      <PageContainer title={t('tun.title')}>
        <div className="text-slate-400">…</div>
      </PageContainer>
    )
  }

  const set = <K extends keyof TunSettings>(k: K, v: TunSettings[K]) =>
    setForm({ ...form, [k]: v } as TunSettings)

  const onSave = async () => {
    await save(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <PageContainer title={t('tun.title')}>
      <div className="space-y-5">
        {!isAdmin && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <div>{t('tun.adminNote')}</div>
              <Button variant="ghost" className="mt-2" onClick={restartAsAdmin}>
                {t('tun.restartAdmin')}
              </Button>
            </div>
          </div>
        )}

        <Field label={t('tun.mode')}>
          <Dropdown
            value={form.mode || 'all'}
            onChange={(v) => set('mode', v)}
            disabled={!isAdmin}
            options={[
              { value: 'all', label: t('tun.modeAll') },
              { value: 'whitelist', label: t('tun.modeWhitelist') },
              { value: 'blacklist', label: t('tun.modeBlacklist') },
            ]}
          />
        </Field>

        {form.mode !== 'all' && (
          <>
            <div>
              <div className="mb-1 text-xs font-medium text-slate-400">{t('tun.cidrs')}</div>
              <ListEditor
                items={form.cidrs ?? []}
                onChange={(v) => set('cidrs', v)}
                placeholder="10.0.0.0/8"
                addLabel={t('tun.addCidr')}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-400">{t('tun.apps')}</span>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  disabled={!isAdmin}
                  className="text-xs font-medium text-brand-300 transition hover:text-brand-200 disabled:opacity-40"
                >
                  {t('tun.pickApp')}
                </button>
              </div>
              <ListEditor
                items={form.apps ?? []}
                onChange={(v) => set('apps', v)}
                placeholder="chrome.exe"
                addLabel={t('tun.addApp')}
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-slate-400">{t('tun.domains')}</div>
              <ListEditor
                items={form.domains ?? []}
                onChange={(v) => set('domains', v)}
                placeholder=".ir  •  github.com"
                addLabel={t('tun.addDomain')}
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-400">{t('tun.dns')}</div>
          <Dropdown
            value={form.dnsProvider || 'cloudflare'}
            onChange={(v) => set('dnsProvider', v)}
            disabled={!isAdmin}
            options={[
              { value: 'cloudflare', label: 'Cloudflare (1.1.1.1)' },
              { value: 'google', label: 'Google (8.8.8.8)' },
              { value: 'adguard', label: 'AdGuard (94.140.14.14)' },
              { value: 'custom', label: t('tun.dnsCustomOption') },
            ]}
          />
          {form.dnsProvider === 'custom' && (
            <TextInput
              value={form.dnsCustom ?? ''}
              onChange={(e) => set('dnsCustom', e.target.value)}
              placeholder="1.1.1.1 or dns.example.com"
              disabled={!isAdmin}
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <span className="text-xs text-slate-500">{t('proxy.applyHint')}</span>
          <Button onClick={onSave} disabled={!isAdmin}>
            {saved ? '✓' : t('common.save')}
          </Button>
        </div>

        <AppPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          selected={form.apps ?? []}
          onApply={(apps) => set('apps', apps)}
        />
      </div>
    </PageContainer>
  )
}
