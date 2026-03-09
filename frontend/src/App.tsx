import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from './components/UI/Toast'
import { ProjectSwitcher } from './components/Projects/ProjectSwitcher'
import { useBoardStore } from './store/boardStore'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function AppShell() {
  const currentProjectId = useBoardStore((s) => s.currentProjectId)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* Top bar */}
      <header className="flex items-center border-b border-slate-200 bg-white px-6 py-3 shrink-0">
        <h1 className="text-lg font-semibold text-slate-900">Project Tracker</h1>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <ProjectSwitcher />

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          {currentProjectId ? (
            <p className="text-sm text-slate-400">
              Board coming in Task 9. Selected project: <code className="text-slate-600">{currentProjectId}</code>
            </p>
          ) : (
            <p className="text-sm text-slate-400">Select or create a project to get started.</p>
          )}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer>
        <AppShell />
      </ToastContainer>
    </QueryClientProvider>
  )
}

export default App
