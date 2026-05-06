interface Props {
  onDismiss: () => void
}

const STEPS = [
  {
    number: '1',
    title: 'Upload your resume',
    description: 'Drop your PDF below. We parse it locally — nothing leaves your browser.',
  },
  {
    number: '2',
    title: 'Open a job posting',
    description: 'Browse to any job on LinkedIn, Naukri, or Indeed. We extract the details automatically.',
  },
  {
    number: '3',
    title: 'See your match',
    description: 'Your skill coverage score and gap analysis appear instantly.',
  },
]

export default function Welcome({ onDismiss }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] text-gray-100">
      {/* Header */}
      <header className="flex items-center border-b border-gray-800 px-4 py-3">
        <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-white">JobMatch</h1>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 gap-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-500">Welcome</p>
          <h2 className="text-xl font-bold leading-tight text-gray-100">
            Match your resume<br />to any job in seconds
          </h2>
          <p className="text-xs text-gray-500 max-w-[220px] mx-auto leading-relaxed">
            100% local. No accounts. No data sent anywhere.
          </p>
        </div>

        {/* Steps */}
        <ol className="w-full space-y-3">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-950 text-[11px] font-bold text-sky-400">
                {step.number}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-gray-200">{step.title}</p>
                <p className="text-xs leading-relaxed text-gray-500">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* CTA */}
        <button
          onClick={onDismiss}
          className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d]"
        >
          Get started
        </button>
      </main>
    </div>
  )
}
