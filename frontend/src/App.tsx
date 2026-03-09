import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from './components/UI/Toast'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer>
        <div className="min-h-screen bg-slate-50">
          <header className="border-b border-slate-200 bg-white px-6 py-4">
            <h1 className="text-xl font-semibold text-slate-900">Project Tracker</h1>
          </header>
          <main className="p-6">
            <p className="text-slate-500 text-sm">Frontend scaffold ready. Board coming in Task 9.</p>
          </main>
        </div>
      </ToastContainer>
    </QueryClientProvider>
  )
}

export default App
