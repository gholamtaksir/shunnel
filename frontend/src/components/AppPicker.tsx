import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Check, Loader2 } from 'lucide-react'
import { Modal, Button, TextInput } from './ui'
import { tunApi } from '../api/tun'

interface Props {
  open: boolean
  onClose: () => void
  selected: string[]
  onApply: (apps: string[]) => void
}

/** Lets the user tick running processes to add to the app list, alongside the
 *  manual text entry. */
export function AppPicker({ open, onClose, selected, onApply }: Props) {
  const { t } = useTranslation()
  const [procs, setProcs] = useState<string[] | null>(null)
  const [query, setQuery] = useState('')
  const [checked, setChecked] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    setProcs(null)
    setQuery('')
    setChecked(new Set(selected))
    tunApi.listProcesses().then((list) => setProcs(list))
  }, [open, selected])

  const filtered = useMemo(
    () => (procs ?? []).filter((p) => p.toLowerCase().includes(query.toLowerCase())),
    [procs, query],
  )

  const toggle = (name: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  const apply = () => {
    // Preserve manually-typed entries (those not among running processes),
    // then add the ticked process names.
    const running = new Set(procs ?? [])
    const manual = selected.filter((s) => !running.has(s))
    onApply(Array.from(new Set([...manual, ...checked])))
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('tun.pickAppTitle')}>
      <TextInput
        autoFocus
        placeholder={t('tun.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="mt-3 max-h-72 space-y-1 overflow-auto pe-1">
        {procs === null ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">—</div>
        ) : (
          filtered.map((p) => {
            const on = checked.has(p)
            return (
              <button
                key={p}
                type="button"
                onClick={() => toggle(p)}
                className={clsx(
                  'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-sm transition',
                  on ? 'bg-brand-500/15 text-brand-200' : 'text-slate-200 hover:bg-slate-800',
                )}
              >
                <span className="truncate font-mono">{p}</span>
                {on && <Check size={15} className="shrink-0 text-brand-300" />}
              </button>
            )
          })
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={apply}>{t('common.save')}</Button>
      </div>
    </Modal>
  )
}
