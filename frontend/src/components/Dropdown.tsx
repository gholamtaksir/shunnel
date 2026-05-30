import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { ChevronDown, Check } from 'lucide-react'

export interface DropdownOption<T extends string = string> {
  value: T
  label: string
}

interface Props<T extends string> {
  value: T
  options: DropdownOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

/** A styled, accessible replacement for the native <select> (which renders an
 *  unstyleable OS popup). Closes on outside-click and Escape. */
export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  disabled,
  placeholder,
  className,
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={clsx('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'flex w-full items-center justify-between gap-2 rounded-lg border bg-slate-900/60 px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50',
          open ? 'border-brand-500' : 'border-slate-700 hover:border-slate-600',
        )}
      >
        <span className={clsx('truncate', selected ? 'text-slate-100' : 'text-slate-500')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={clsx('shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-700 bg-slate-800 p-1 shadow-xl">
          {options.map((o) => {
            const active = o.value === value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={clsx(
                  'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-sm transition',
                  active ? 'bg-brand-500/15 text-brand-200' : 'text-slate-200 hover:bg-slate-700',
                )}
              >
                <span className="truncate">{o.label}</span>
                {active && <Check size={15} className="shrink-0 text-brand-300" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
