import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './en.json'
import fa from './fa.json'

export const languages = {
  en: { label: 'English', dir: 'ltr' as const },
  fa: { label: 'فارسی', dir: 'rtl' as const },
}

export type Lang = keyof typeof languages

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fa: { translation: fa },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fa'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'shunnel.lang',
    },
  })

/** Apply the document text direction and lang attribute for a language. */
export function applyDir(lang: string) {
  const dir = languages[lang as Lang]?.dir ?? 'ltr'
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', lang)
}

applyDir(i18n.language)
i18n.on('languageChanged', applyDir)

export default i18n
