import { useState } from 'react'

interface Props {
  matched: string[]
  missing: string[]
}

const INITIAL_SHOW = 8

function Chip({ label, variant }: { label: string; variant: 'matched' | 'missing' }) {
  const base = 'inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium'
  const styles =
    variant === 'matched'
      ? `${base} bg-gray-800 text-gray-300`
      : `${base} bg-gray-800/80 text-gray-200 ring-1 ring-inset ring-gray-600`
  const dotColor = variant === 'matched' ? 'bg-emerald-500' : 'bg-rose-500'

  return (
    <span className={styles}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
      {label}
    </span>
  )
}

function SkillList({ skills, variant }: { skills: string[]; variant: 'matched' | 'missing' }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? skills : skills.slice(0, INITIAL_SHOW)
  const hasMore = skills.length > INITIAL_SHOW

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((label) => (
        <Chip key={label} label={label} variant={variant} />
      ))}
      {hasMore && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
        >
          {showAll ? 'Show less' : `+${skills.length - INITIAL_SHOW} more`}
        </button>
      )}
    </div>
  )
}

export default function SkillGap({ matched, missing }: Props) {
  if (matched.length === 0 && missing.length === 0) return null

  return (
    <div className="space-y-4 px-4 pt-4 pb-6">
      {missing.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Missing <span className="text-rose-500/70">({missing.length})</span>
          </h3>
          <SkillList skills={missing} variant="missing" />
        </div>
      )}
      {matched.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Matched <span className="text-emerald-500/60">({matched.length})</span>
          </h3>
          <SkillList skills={matched} variant="matched" />
        </div>
      )}
    </div>
  )
}
