/**
 * AgentActivityIntegration.test.tsx
 * QA Task 7 — Integration/regression tests for agent activity features:
 *  - Agent filter on KanbanBoard
 *  - AlfredStrip idle/active states
 *  - ActiveAgentsPanel toggle
 *  - AgentChip fallback via TaskModal (PR #22 fix)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Component imports ─────────────────────────────────────────────────────────
import { AlfredStrip } from '../components/Agents/AlfredStrip'
import { ActiveAgentsPanel } from '../components/Agents/ActiveAgentsPanel'
import { AgentChip } from '../components/Agents/AgentChip'
import { KanbanBoard } from '../components/Board/KanbanBoard'

import type { Task, AgentSummary } from '../api/types'

// ── Mock dnd-kit (same as KanbanBoard.test.tsx) ───────────────────────────────

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PointerSensor: class {},
  KeyboardSensor: class {},
  useSensor: () => ({}),
  useSensors: (...args: unknown[]) => args,
  closestCorners: () => null,
  useDroppable: () => ({ setNodeRef: () => undefined, isOver: false }),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => undefined,
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: () => ({}),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

// ── Mock hooks ────────────────────────────────────────────────────────────────

const mockUseTasks = vi.fn()
vi.mock('../hooks/useTasks', () => ({
  useTasks: (...args: unknown[]) => mockUseTasks(...args),
  useDeleteTask: () => ({ mutateAsync: vi.fn() }),
  useMoveTask: () => ({ mutateAsync: vi.fn() }),
  TASK_KEYS: { all: (id: string) => ['tasks', id] },
}))

vi.mock('../components/UI/Toast', () => ({
  useToast: () => vi.fn(),
}))

vi.mock('../store/boardStore', () => ({
  useBoardStore: (selector: (s: { moveTaskOptimistic: () => void; revertTask: () => void; optimisticTasks: Record<string, Partial<Task>> }) => unknown) =>
    selector({
      moveTaskOptimistic: vi.fn(),
      revertTask: vi.fn(),
      optimisticTasks: {},
    }),
}))

// ── Mock agents API (for ActiveAgentsPanel) ───────────────────────────────────

vi.mock('../api/agents', () => ({
  agentsApi: {
    getSummary: vi.fn(),
  },
}))
import { agentsApi } from '../api/agents'

// ── Task factory ──────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    projectId: 'proj-1',
    sprintId: null,
    title: 'Default Task',
    priority: 'medium',
    type: 'feature',
    assignee: null,
    assigneeAgentKey: null,
    column: 'Backlog',
    position: 0,
    githubPrUrl: null,
    githubIssueUrl: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderBoard(tasks: Task[], agentFilter?: string) {
  const qc = new QueryClient()
  mockUseTasks.mockReturnValue({ data: tasks, isLoading: false, isError: false })
  return render(
    <QueryClientProvider client={qc}>
      <KanbanBoard
        projectId="proj-1"
        onAddTask={vi.fn()}
        onTaskClick={vi.fn()}
        agentFilter={agentFilter}
      />
    </QueryClientProvider>,
  )
}

// ── AgentSummary factory ──────────────────────────────────────────────────────

function makeSummary(overrides: Partial<AgentSummary> = {}): AgentSummary {
  return {
    agentKey: 'frontend',
    name: 'Pixel',
    emoji: '🎨',
    status: 'idle',
    activeTaskCount: 0,
    currentFocus: null,
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

// ── 1. Agent filter "All" shows all tasks ─────────────────────────────────────

describe('Agent filter — "All" shows all tasks', () => {
  it('renders all tasks when no agentFilter is set', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Pixel Task', assigneeAgentKey: 'frontend', column: 'Backlog' }),
      makeTask({ id: 't2', title: 'Bastion Task', assigneeAgentKey: 'backend', column: 'InProgress' }),
    ]
    renderBoard(tasks)
    expect(screen.getByText('Pixel Task')).toBeInTheDocument()
    expect(screen.getByText('Bastion Task')).toBeInTheDocument()
  })
})

// ── 2. Agent filter by agent hides other tasks ────────────────────────────────

describe('Agent filter — filter by "frontend" hides non-Pixel tasks', () => {
  it('only shows tasks assigned to frontend when agentFilter="frontend"', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Pixel Task', assigneeAgentKey: 'frontend', column: 'Backlog' }),
      makeTask({ id: 't2', title: 'Bastion Task', assigneeAgentKey: 'backend', column: 'Backlog' }),
    ]
    renderBoard(tasks, 'frontend')
    expect(screen.getByText('Pixel Task')).toBeInTheDocument()
    expect(screen.queryByText('Bastion Task')).toBeNull()
  })
})

// ── 3. AlfredStrip shows idle when no active tasks ────────────────────────────

describe('AlfredStrip — idle state', () => {
  it('shows "Alfred — system idle" when all agents have 0 active tasks', () => {
    const idleSummary: AgentSummary[] = [
      makeSummary({ agentKey: 'frontend', name: 'Pixel', status: 'idle', activeTaskCount: 0 }),
      makeSummary({ agentKey: 'backend', name: 'Bastion', status: 'idle', activeTaskCount: 0 }),
    ]
    render(<AlfredStrip summary={idleSummary} />)
    expect(screen.getByText(/alfred.*system idle/i)).toBeInTheDocument()
  })

  it('shows idle state with empty summary', () => {
    render(<AlfredStrip summary={[]} />)
    expect(screen.getByText(/alfred.*system idle/i)).toBeInTheDocument()
  })
})

// ── 4. AlfredStrip shows active agents when tasks in progress ─────────────────

describe('AlfredStrip — active state', () => {
  it('shows active task count and agent names when 2 agents have tasks', () => {
    const activeSummary: AgentSummary[] = [
      makeSummary({ agentKey: 'frontend', name: 'Pixel', status: 'active', activeTaskCount: 2 }),
      makeSummary({ agentKey: 'backend', name: 'Bastion', status: 'active', activeTaskCount: 1 }),
    ]
    render(<AlfredStrip summary={activeSummary} />)
    expect(screen.getByText(/alfred coordinating 3 active tasks/i)).toBeInTheDocument()
    expect(screen.getByText(/pixel.*and.*bastion|bastion.*and.*pixel/i)).toBeInTheDocument()
  })

  it('shows single agent name when only 1 agent is active', () => {
    const activeSummary: AgentSummary[] = [
      makeSummary({ agentKey: 'frontend', name: 'Pixel', status: 'active', activeTaskCount: 1 }),
    ]
    render(<AlfredStrip summary={activeSummary} />)
    expect(screen.getByText(/alfred coordinating 1 active task/i)).toBeInTheDocument()
    expect(screen.getByText(/pixel/i)).toBeInTheDocument()
  })
})

// ── 5. ActiveAgentsPanel toggle ───────────────────────────────────────────────

describe('ActiveAgentsPanel toggle', () => {
  it('is collapsed by default (no body visible)', () => {
    vi.mocked(agentsApi.getSummary).mockResolvedValue([])
    render(<ActiveAgentsPanel />)
    expect(screen.queryByText('No active agents right now')).toBeNull()
  })

  it('expands on chevron click', async () => {
    const user = userEvent.setup()
    vi.mocked(agentsApi.getSummary).mockResolvedValue([
      makeSummary({ agentKey: 'frontend', status: 'idle', activeTaskCount: 0 }),
    ])
    render(<ActiveAgentsPanel />)
    const expandBtn = screen.getByRole('button', { name: /expand agents panel/i })
    await user.click(expandBtn)
    expect(await screen.findByText('No active agents right now')).toBeInTheDocument()
  })

  it('collapses on second chevron click', async () => {
    const user = userEvent.setup()
    vi.mocked(agentsApi.getSummary).mockResolvedValue([
      makeSummary({ agentKey: 'frontend', status: 'idle', activeTaskCount: 0 }),
    ])
    render(<ActiveAgentsPanel />)
    const expandBtn = screen.getByRole('button', { name: /expand agents panel/i })
    await user.click(expandBtn)
    // Panel now expanded — find collapse button
    const collapseBtn = await screen.findByRole('button', { name: /collapse agents panel/i })
    await user.click(collapseBtn)
    await waitFor(() => {
      expect(screen.queryByText('No active agents right now')).toBeNull()
    })
  })

  it('shows active agent names when panel expanded with active agents', async () => {
    const user = userEvent.setup()
    vi.mocked(agentsApi.getSummary).mockResolvedValue([
      makeSummary({ agentKey: 'frontend', name: 'Pixel', status: 'active', activeTaskCount: 2, currentFocus: 'Building chips' }),
    ])
    render(<ActiveAgentsPanel />)
    await user.click(screen.getByRole('button', { name: /expand agents panel/i }))
    expect(await screen.findByText('Pixel')).toBeInTheDocument()
    expect(await screen.findByText('active')).toBeInTheDocument()
    expect(await screen.findByText('Building chips')).toBeInTheDocument()
  })
})

// ── 6. AgentChip fallback — PR #22 fix ───────────────────────────────────────

describe('AgentChip fallback', () => {
  it('renders "Unassigned" for unknown agentKey (baseline)', () => {
    render(<AgentChip agentKey="unknown-xyz" />)
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
  })

  it('renders Pixel chip for known "frontend" agentKey', () => {
    render(<AgentChip agentKey="frontend" />)
    expect(screen.getByText('Pixel')).toBeInTheDocument()
    expect(screen.getByText('🎨')).toBeInTheDocument()
  })

  it('task with assigneeAgentKey="frontend" shows agent chip, not "Unassigned"', () => {
    // This mirrors the PR #22 fix: tasks with assigneeAgentKey set show the chip
    const tasks = [
      makeTask({
        id: 't1',
        title: 'Legacy Task',
        assignee: 'Pixel',
        assigneeAgentKey: 'frontend', // PR #22 fix ensures this is resolved via modal
        column: 'Backlog',
      }),
    ]
    renderBoard(tasks)
    // The task card should show "Pixel" chip, not "Unassigned"
    expect(screen.getByText('Pixel')).toBeInTheDocument()
    expect(screen.queryByText('Unassigned')).toBeNull()
  })

  it('task with assigneeAgentKey=null shows assignee text, not chip', () => {
    // Legacy tasks without assigneeAgentKey show plain text assignee
    const tasks = [
      makeTask({
        id: 't1',
        title: 'Legacy Task',
        assignee: 'John Doe',
        assigneeAgentKey: null,
        column: 'Backlog',
      }),
    ]
    renderBoard(tasks)
    // Shows plain assignee name, not a chip
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Unassigned')).toBeNull()
  })
})
