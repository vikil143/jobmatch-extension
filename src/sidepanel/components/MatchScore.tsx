interface Props {
  score: number
  skillCoverage?: number
  keywordOverlap?: number
  semanticScore?: number
  semanticLoading?: boolean
}

function scoreColor(score: number): { text: string; bar: string; track: string; label: string } {
  if (score >= 76) return { text: 'text-emerald-400', bar: 'bg-emerald-500', track: 'bg-emerald-950', label: 'Strong match' }
  if (score >= 50) return { text: 'text-amber-400', bar: 'bg-amber-500', track: 'bg-amber-950', label: 'Partial match' }
  return { text: 'text-rose-400', bar: 'bg-rose-600', track: 'bg-rose-950', label: 'Weak match' }
}

export default function MatchScore({ score, skillCoverage, keywordOverlap, semanticScore, semanticLoading }: Props) {
  const colors = scoreColor(score)
  const pct = Math.min(100, Math.max(0, score))

  return (
    <div className="flex flex-col items-center gap-2 py-6 px-4">
      <span className={`font-mono text-6xl font-bold leading-none tabular-nums ${colors.text}`}>
        {score}
      </span>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-500">
          Match score
        </span>
        <span className={`text-xs font-medium ${colors.text}`}>{colors.label}</span>
      </div>
      <div className={`mt-1 h-1.5 w-40 rounded-full ${colors.track}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Method badge — shows which scoring mode produced this result */}
      <div className="flex items-center gap-1">
        {semanticLoading ? (
          <>
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
            <span className="text-[10px] text-gray-600">loading semantic model…</span>
          </>
        ) : semanticScore !== undefined ? (
          <>
            <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            <span className="text-[10px] text-sky-600">semantic</span>
          </>
        ) : (
          <>
            <div className="h-1.5 w-1.5 rounded-full bg-gray-700" />
            <span className="text-[10px] text-gray-600">tf-idf</span>
          </>
        )}
      </div>

      {(skillCoverage !== undefined || keywordOverlap !== undefined) && (
        <div className="mt-2 flex gap-6 text-center">
          {skillCoverage !== undefined && (
            <div>
              <p className="font-mono text-sm font-semibold text-gray-300 tabular-nums">
                {Math.round(skillCoverage * 100)}%
              </p>
              <p className="text-[10px] text-gray-600">skill coverage</p>
            </div>
          )}
          {keywordOverlap !== undefined && (
            <div>
              <p className="font-mono text-sm font-semibold text-gray-300 tabular-nums">
                {Math.round(keywordOverlap * 100)}%
              </p>
              <p className="text-[10px] text-gray-600">keyword overlap</p>
            </div>
          )}
          {semanticScore !== undefined && (
            <div>
              <p className="font-mono text-sm font-semibold text-sky-400 tabular-nums">
                {Math.round(semanticScore * 100)}%
              </p>
              <p className="text-[10px] text-gray-600">semantic sim</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
