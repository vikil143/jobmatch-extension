import { useState, useEffect } from 'react'
import { profileStorage } from '../../lib/storage'
import type { Profile } from '../../types/jobs'

const EMPTY: Profile = { firstName: '', lastName: '', email: '', phone: '', linkedIn: '' }

type SavePhase = 'idle' | 'saving' | 'saved' | 'error'

export default function ProfileEditor() {
  const [draft, setDraft] = useState<Profile>(EMPTY)
  const [phase, setPhase] = useState<SavePhase>('idle')

  useEffect(() => {
    void profileStorage.get().then((p) => { if (p) setDraft(p) })
  }, [])

  function set(field: keyof Profile, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }))
    if (phase === 'saved' || phase === 'error') setPhase('idle')
  }

  async function handleSave() {
    setPhase('saving')
    try {
      await profileStorage.set(draft)
      setPhase('saved')
      setTimeout(() => setPhase('idle'), 2500)
    } catch {
      setPhase('error')
      setTimeout(() => setPhase('idle'), 3000)
    }
  }

  async function handleClear() {
    await profileStorage.clear()
    setDraft(EMPTY)
    setPhase('idle')
  }

  const busy = phase === 'saving'

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">Profile</h3>
      <p className="text-[11px] text-gray-600">
        Saved here, used to auto-fill Greenhouse application forms.
      </p>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Field label="First name" value={draft.firstName} onChange={(v) => set('firstName', v)} disabled={busy} />
          <Field label="Last name" value={draft.lastName} onChange={(v) => set('lastName', v)} disabled={busy} />
        </div>
        <Field label="Email" type="email" value={draft.email} onChange={(v) => set('email', v)} disabled={busy} />
        <Field label="Phone" type="tel" value={draft.phone} onChange={(v) => set('phone', v)} disabled={busy} />
        <Field label="LinkedIn URL" type="url" value={draft.linkedIn} onChange={(v) => set('linkedIn', v)} disabled={busy} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => void handleSave()}
          disabled={busy}
          className="flex-1 rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
        >
          {phase === 'saving' ? 'Saving…' : phase === 'saved' ? 'Saved' : 'Save profile'}
        </button>
        <button
          onClick={() => void handleClear()}
          disabled={busy}
          className="rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-gray-600 hover:text-gray-400 disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      {phase === 'error' && (
        <p className="text-[11px] text-red-400">Save failed — try again.</p>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  type = 'text',
  onChange,
  disabled,
}: {
  label: string
  value: string
  type?: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  return (
    <div className="flex-1 min-w-0">
      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded border border-gray-800 bg-gray-900/80 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-700 outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-800 disabled:opacity-50"
      />
    </div>
  )
}
