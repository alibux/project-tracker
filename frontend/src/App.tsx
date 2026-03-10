import * as React from 'react'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ToastContainer } from './components/UI/Toast'
import { ProjectSwitcher } from './components/Projects/ProjectSwitcher'
import { KanbanBoard } from './components/Board/KanbanBoard'
import { TaskModal } from './components/Tasks/TaskModal'
import { SprintPanel } from './components/Sprints/SprintPanel'
import { useBoardStore } from './store/boardStore'
import { useSprints } from './hooks/useSprints'
import { TASK_KEYS } from './hooks/useTasks'
import type { Task } from './api/types'
import type { Column } from './data/constants'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function SprintFilter({ projectId }: { projectId: string }) {
  const { data: sprints = [] } = useSprints(projectId)
  const currentSprintId = useBoardStore((s) => s.currentSprintId)
  const setCurrentSprintId = useBoardStore((s) => s.setCurrentSprintId)

  const activeSprint = sprints.find((s) => s.isActive)

  // Auto-select active sprint on project load
  const hasSetInitial = useBoardStore((s) => s.currentSprintId !== undefined)
  if (hasSetInitial && currentSprintId === null && activeSprint) {
    // handled in effect below — just render
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400">Sprint:</span>
      <select
        value={currentSprintId ?? ''}
        onChange={(e) => setCurrentSprintId(e.target.value || null)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        <option value="">All tasks</option>
        {sprints.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}{s.isActive ? ' (active)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

function BoardArea({ projectId }: { projectId: string }) {
  const currentSprintId = useBoardStore((s) => s.currentSprintId)
  const qc = useQueryClient()
  const [sprintPanelOpen, setSprintPanelOpen] = React.useState(false)

  type ModalState =
    | { open: false }
    | { open: true; mode: 'create'; defaultColumn: Column }
    | { open: true; mode: 'edit'; task: Task }

  const [modal, setModal] = React.useState<ModalState>({ open: false })

  function handleAddTask(column: string) {
    setModal({ open: true, mode: 'create', defaultColumn: column as Column })
  }

  function handleTaskClick(task: Task) {
    setModal({ open: true, mode: 'edit', task })
  }

  function handleClose() {
    setModal({ open: false })
  }

  function handleSaved() {
    qc.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Board toolbar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-200 bg-white shrink-0">
        <SprintFilter projectId={projectId} />
        <button
          onClick={() => setSprintPanelOpen((o) => !o)}
          className="ml-2 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors"
        >
          {sprintPanelOpen ? 'Hide Sprints' : 'Sprints'}
        </button>
      </div>

      {/* Board + optional sprint panel */}
      <div className="flex flex-1 overflow-hidden">
        {sprintPanelOpen && <SprintPanel projectId={projectId} />}
        <div className="flex-1 overflow-hidden">
          <KanbanBoard
            projectId={projectId}
            sprintId={currentSprintId}
            onAddTask={handleAddTask}
            onTaskClick={handleTaskClick}
          />
        </div>
      </div>

      {modal.open && modal.mode === 'create' && (
        <TaskModal
          open
          mode="create"
          projectId={projectId}
          defaultColumn={modal.defaultColumn}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
      {modal.open && modal.mode === 'edit' && (
        <TaskModal
          open
          mode="edit"
          task={modal.task}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

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

        <main className="flex-1 overflow-hidden">
          {currentProjectId ? (
            <BoardArea projectId={currentProjectId} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-400">Select or create a project to get started.</p>
            </div>
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
