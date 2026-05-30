import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '../components/PageContainer'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { settingsApi, type AppInfo } from '../api/settings'

export function SettingsPage() {
  const { t } = useTranslation()
  const [autostart, setAutostart] = useState(false)
  const [info, setInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    settingsApi.getAutostart().then(setAutostart)
    settingsApi.appInfo().then(setInfo)
  }, [])

  const toggleAutostart = async (v: boolean) => {
    setAutostart(v)
    await settingsApi.setAutostart(v)
  }

  return (
    <PageContainer title={t('settings.title')}>
      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-sm font-medium text-slate-300">{t('settings.language')}</h2>
          <div className="max-w-xs">
            <LanguageSwitcher />
          </div>
        </section>

        <section>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={autostart}
              onChange={(e) => toggleAutostart(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-brand-500"
            />
            {t('settings.autostart')}
          </label>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-slate-300">{t('settings.about')}</h2>
          <div className="text-sm text-slate-400">
            {info ? `${info.name} v${info.version}` : '…'}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
