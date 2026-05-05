import CVUpload from './components/CVUpload'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] text-gray-100">
      <header className="flex items-center border-b border-gray-800 px-4 py-3">
        <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-white">JobMatch</h1>
      </header>
      <main className="flex-1">
        <CVUpload />
      </main>
    </div>
  )
}
