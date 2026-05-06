import { useState, useEffect } from 'react'
import { profileStorage } from '../../lib/storage'
import type { UserProfile } from '../../types/jobs'

const EMPTY_PROFILE: UserProfile = {
  fullName: '',
  preferredName: '',
  cityCountry: '',
  linkedinUrl: '',
  githubUrl: '',
}

export default function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void profileStorage.get().then((p) => {
      if (p) setProfile(p)
    })
  }, [])

  function handleChange(field: keyof UserProfile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    await profileStorage.set(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">Profile</h3>
      <p className="text-[10px] leading-relaxed text-gray-600">
        Used to personalize cover letter sign-offs. All fields optional.
      </p>

      <div className="space-y-2">
        <div>
          <label className="mb-1 block text-[10px] font-medium text-gray-600">Full name</label>
          <input
            type="text"
            value={profile.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Jane Smith"
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 placeholder-gray-700 focus:border-sky-700/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-gray-600">
            Preferred name <span className="text-gray-700">(optional)</span>
          </label>
          <input
            type="text"
            value={profile.preferredName}
            onChange={(e) => handleChange('preferredName', e.target.value)}
            placeholder="Jane"
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 placeholder-gray-700 focus:border-sky-700/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-gray-600">
            City / Country <span className="text-gray-700">(optional)</span>
          </label>
          <input
            type="text"
            value={profile.cityCountry}
            onChange={(e) => handleChange('cityCountry', e.target.value)}
            placeholder="London, UK"
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 placeholder-gray-700 focus:border-sky-700/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-gray-600">
            LinkedIn URL <span className="text-gray-700">(optional)</span>
          </label>
          <input
            type="url"
            value={profile.linkedinUrl}
            onChange={(e) => handleChange('linkedinUrl', e.target.value)}
            placeholder="https://linkedin.com/in/…"
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 placeholder-gray-700 focus:border-sky-700/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-gray-600">
            GitHub URL <span className="text-gray-700">(optional)</span>
          </label>
          <input
            type="url"
            value={profile.githubUrl}
            onChange={(e) => handleChange('githubUrl', e.target.value)}
            placeholder="https://github.com/…"
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 placeholder-gray-700 focus:border-sky-700/60 focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={() => void handleSave()}
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-200"
      >
        {saved ? 'Saved ✓' : 'Save profile'}
      </button>
    </div>
  )
}
