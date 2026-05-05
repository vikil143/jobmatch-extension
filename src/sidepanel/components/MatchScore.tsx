interface Props {
  score: number
}

function scoreColor(score: number): { text: string; bar: string; track: string } {
  if (score >= 76) return { text: 'text-emerald-400', bar: 'bg-emerald-500', track: 'bg-emerald-950' }
  if (score >= 50) return { text: 'text-amber-400', bar: 'bg-amber-500', track: 'bg-amber-950' }
  return { text: 'text-rose-400', bar: 'bg-rose-600', track: 'bg-rose-950' }
}

export default function MatchScore({ score }: Props) {
  const colors = scoreColor(score)
  const pct = Math.min(100, Math.max(0, score))

  return (
    <div className="flex flex-col items-center gap-2 py-6">
      <span className={`font-mono text-6xl font-bold leading-none tabular-nums ${colors.text}`}>
        {score}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-500">
        Match
      </span>
      <div className={`mt-1 h-1 w-32 rounded-full ${colors.track}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
