import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, TextInput, Field, Modal } from './ui'
import { Dropdown } from './Dropdown'
import { type ServerInput, type ServerProfile, type AuthMethod } from '../api/servers'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (p: ServerInput) => Promise<void>
  initial?: ServerProfile | null
}

export function ServerForm({ open, onClose, onSubmit, initial }: Props) {
  const { t } = useTranslation()
  const editing = !!initial
  const [form, setForm] = useState<ServerInput>(() => ({
    id: initial?.id,
    name: initial?.name ?? '',
    host: initial?.host ?? '',
    port: initial?.port ?? 22,
    user: initial?.user ?? '',
    authMethod: (initial?.authMethod as AuthMethod) ?? 'password',
    secret: '',
    passphrase: '',
  }))
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof ServerInput>(k: K, v: ServerInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? t('common.edit') : t('servers.addServer')}>
      <div className="space-y-3">
        <Field label={t('servers.name')}>
          <TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="My server" />
        </Field>
        <div className="flex gap-3">
          <div className="flex-1">
            <Field label={t('servers.host')}>
              <TextInput value={form.host} onChange={(e) => set('host', e.target.value)} placeholder="1.2.3.4" />
            </Field>
          </div>
          <div className="w-24">
            <Field label={t('servers.port')}>
              <TextInput
                type="number"
                value={form.port}
                onChange={(e) => set('port', Number(e.target.value))}
              />
            </Field>
          </div>
        </div>
        <Field label={t('servers.user')}>
          <TextInput value={form.user} onChange={(e) => set('user', e.target.value)} placeholder="root" />
        </Field>
        <Field label={t('servers.auth')}>
          <Dropdown
            value={form.authMethod}
            onChange={(v) => set('authMethod', v)}
            options={[
              { value: 'password', label: t('servers.password') },
              { value: 'key', label: t('servers.privateKey') },
            ]}
          />
        </Field>
        {form.authMethod === 'password' ? (
          <Field label={t('servers.password')}>
            <TextInput
              type="password"
              value={form.secret}
              onChange={(e) => set('secret', e.target.value)}
              placeholder={editing ? '••••••' : ''}
            />
          </Field>
        ) : (
          <>
            <Field label={t('servers.privateKey')}>
              <textarea
                className="h-24 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-xs text-slate-100 outline-none focus:border-brand-500"
                value={form.secret}
                onChange={(e) => set('secret', e.target.value)}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
              />
            </Field>
            <Field label={t('servers.passphrase')}>
              <TextInput
                type="password"
                value={form.passphrase}
                onChange={(e) => set('passphrase', e.target.value)}
              />
            </Field>
          </>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={saving || !form.host}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
