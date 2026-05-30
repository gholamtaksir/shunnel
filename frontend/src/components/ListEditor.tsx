import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { TextInput, Button } from './ui'

interface Props {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  addLabel: string
}

export function ListEditor({ items, onChange, placeholder, addLabel }: Props) {
  const [value, setValue] = useState('')

  const add = () => {
    const v = value.trim()
    if (!v || items.includes(v)) return
    onChange([...items, v])
    setValue('')
  }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <TextInput
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button variant="ghost" onClick={add}>
          <Plus size={16} />
          {addLabel}
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((it, i) => (
            <span
              key={it}
              className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-xs"
            >
              <span className="font-mono">{it}</span>
              <button
                onClick={() => remove(i)}
                className="text-slate-400 transition hover:text-rose-300"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
