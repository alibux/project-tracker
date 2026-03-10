import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KanbanBoard } from '../components/Board/KanbanBoard'
import type { Task } from '../api/types'

// ── Mock dnd-kit ──────────────────────────────────────────────────────────────

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

const mockToast = vi.fn()
vi.mock('../components/UI/Toast', () => ({
  useToast: () => mockToast,
}))

// ── Mock boardStore ───────────────────────────────────────────────────────────

vi.mock('../store/boardStore', () => ({
  useBoardStore: (selector: (s: { moveTaskOptimistic: () => void; revertTask: () => void; optimisticTasks: Record<string, Partial<Task>> }) => unknown) =>
    selector({
      moveTaskOptimistic: vi.fn(),
      revertTask: vi.fn(),
      optimisticTasks: {},
    }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeTasks = (): Task[] => [
  {
    id: 't1',
    projectId: 'proj-1',
    sprintId: null,
    title: 'Backlog Task',
    priority: 'low',
    type: 'chore',
    assignee: null,
    column: 'Backlog',
    position: 0,
    githubPrUrl: null,
    githubIssueUrl: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 't2',
    projectId: 'proj-1',
    sprintId: null,
    title: 'InProgress Task',
    priority: 'medium',
    type: 'feature',
    assignee: null,
    column: 'InProgress',
    position: 0,
    githubPrUrl: null,
    githubIssueUrl: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

function renderBoard(overrides?: { tasks?: Task[]; isLoading?: boolean; isError?: boolean }) {
  mockUseTasks.mockReturnValue({
    data: overrides?.tasks ?? makeTasks(),
    isLoading: overrides?.isLoading ?? false,
    isError: overrides?.isError ?? false,
  })

  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onAddTask = vi.fn()
  const onTaskClick = vi.fn()

  const result = render(
    <QueryClientProvider client={qc}>
      <KanbanBoard projectId="proj-1" onAddTask={onAddTask} onTaskClick={onTaskClick} />
    </QueryClientProvider>,
  )

  return { ...result, onAddTask, onTaskClick }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. renders all 4 column headers', () => {
    renderBoard()
    expect(screen.getByText('Backlog')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('In Review')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('2. renders tasks in their correct columns', () => {
    renderBoard()
    expect(screen.getByText('Backlog Task')).toBeInTheDocument()
    expect(screen.getByText('InProgress Task')).toBeInTheDocument()
  })

  it('3. shows loading skeleton when tasks are loading', () => {
    mockUseTasks.mockReturnValue({ data: [], isLoading: true, isError: false })
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <KanbanBoard projectId="proj-1" onAddTask={vi.fn()} onTaskClick={vi.fn()} />
      </QueryClientProvider>,
    )
    // 4 skeleton divs with animate-pulse
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(4)
  })

  it('4. shows "No tasks" empty state per column when no tasks exist', () => {
    renderBoard({ tasks: [] })
    const emptyMessages = screen.getAllByText('No tasks')
    // One per column = 4
    expect(emptyMessages.length).toBe(4)
  })

  it('5. clicking + button on a column calls onAddTask with that column', async () => {
    const { onAddTask } = renderBoard()
    const addBacklogBtn = screen.getByTitle('Add task to Backlog')
    await userEvent.click(addBacklogBtn)
    expect(onAddTask).toHaveBeenCalledWith('Backlog')
  })

  it('6. clicking + on In Progress calls onAddTask with InProgress', async () => {
    const { onAddTask } = renderBoard()
    const addBtn = screen.getByTitle('Add task to In Progress')
    await userEvent.click(addBtn)
    expect(onAddTask).toHaveBeenCalledWith('InProgress')
  })

  it('7. renders task count badge per column', () => {
    renderBoard()
    // Backlog column has 1 task, InProgress has 1 task
    // Badges show the count — find spans with text '1'
    const countBadges = screen.getAllByText('1')
    expect(countBadges.length).toBeGreaterThanOrEqual(2)
    // InReview and Done have 0
    const zeroBadges = screen.getAllByText('0')
    expect(zeroBadges.length).toBe(2)
  })

  it('8. shows error state when tasks fail to load', () => {
    mockUseTasks.mockReturnValue({ data: [], isLoading: false, isError: true })
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <KanbanBoard projectId="proj-1" onAddTask={vi.fn()} onTaskClick={vi.fn()} />
      </QueryClientProvider>,
    )
    expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument()
  })
})
