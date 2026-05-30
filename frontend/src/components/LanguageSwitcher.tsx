import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Languages } from 'lucide-react'
import { languages, type Lang } from '../i18n'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language as Lang

  return (
    <div className="flex items-center gap-1 rounded-lg bg-slate-800/60 p-1">
      <Languages size={16} className="mx-1 shrink-0 text-slate-400" />
      {(Object.keys(languages) as Lang[]).map((lng) => (
        <button
          key={lng}
          onClick={() => i18n.changeLanguage(lng)}
          className={clsx(
            'flex-1 rounded-md px-2 py-1 text-xs font-medium transition',
            current === lng
              ? 'bg-brand-500 text-white'
              : 'text-slate-300 hover:bg-slate-700',
          )}
        >
          {languages[lng].label}
        </button>
      ))}
    </div>
  )
}
