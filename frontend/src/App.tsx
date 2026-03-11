import * as React from 'react'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ToastContainer } from './components/UI/Toast'
import { ProjectSwitcher } from './components/Projects/ProjectSwitcher'
import { KanbanBoard } from './components/Board/KanbanBoard'
import { TaskModal } from './components/Tasks/TaskModal'
import { SprintPanel } from './components/Sprints/SprintPanel'
import { SettingsPage } from './components/Settings/SettingsPage'
import { AlfredStrip } from './components/Agents/AlfredStrip'
import { ActiveAgentsPanel } from './components/Agents/ActiveAgentsPanel'
import { AGENTS } from './components/Agents/AgentChip'
import { useBoardStore } from './store/boardStore'
import { useSprints } from './hooks/useSprints'
import { TASK_KEYS, useTasks } from './hooks/useTasks'
import { agentsApi } from './api/agents'
import type { Task } from './api/types'
import type { AgentSummary } from './api/types'
import type { Column } from './data/constants'
import { cn } from './lib/utils'
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
  const [selectedAgentKey, setSelectedAgentKey] = React.useState<string | null>(null)
  const [agentSummary, setAgentSummary] = React.useState<AgentSummary[]>([])

  // Fetch tasks to determine which agents have tasks in this project
  const { data: tasks = [] } = useTasks(projectId, currentSprintId)

  // Fetch agent summary for AlfredStrip
  React.useEffect(() => {
    agentsApi.getSummary().then(setAgentSummary).catch(() => setAgentSummary([]))
  }, [projectId])

  // Agents that have ≥1 task in the current project
  const agentsWithTasks = React.useMemo(() => {
    const keys = new Set(tasks.map((t) => t.assigneeAgentKey).filter(Boolean) as string[])
    return Array.from(keys).filter((k) => k in AGENTS)
  }, [tasks])

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
      <div className="flex items-center flex-wrap gap-3 px-6 py-3 border-b border-slate-200 bg-white shrink-0">
        <SprintFilter projectId={projectId} />
        <button
          onClick={() => setSprintPanelOpen((o) => !o)}
          className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors"
        >
          {sprintPanelOpen ? 'Hide Sprints' : 'Sprints'}
        </button>

        {/* Agent filter chips */}
        {agentsWithTasks.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedAgentKey(null)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                selectedAgentKey === null
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              )}
            >
              All
            </button>
            {agentsWithTasks.map((key) => {
              const agent = AGENTS[key]
              if (!agent) return null
              const selected = selectedAgentKey === key
              return (
                <button
                  key={key}
                  onClick={() => setSelectedAgentKey(key)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    selected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  )}
                >
                  {agent.emoji} {agent.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Alfred strip + Active Agents panel */}
      <div className="px-6 pt-4 shrink-0">
        <AlfredStrip summary={agentSummary} />
        <ActiveAgentsPanel />
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
            agentFilter={selectedAgentKey}
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
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shrink-0">
        <h1 className="text-lg font-semibold text-slate-900">Project Tracker</h1>
        <button
          aria-label="Open settings"
          onClick={() => setSettingsOpen(true)}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors"
        >
          ⚙️
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {settingsOpen ? (
          <div className="flex-1 overflow-hidden">
            <SettingsPage onClose={() => setSettingsOpen(false)} />
          </div>
        ) : (
          <>
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
          </>
        )}
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
