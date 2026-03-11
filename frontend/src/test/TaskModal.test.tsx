import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskModal, type TaskModalProps } from '../components/Tasks/TaskModal'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCreateTask = vi.fn()
const mockUpdateTask = vi.fn()

vi.mock('../hooks/useTasks', () => ({
  useCreateTask: () => ({ mutateAsync: mockCreateTask }),
  useUpdateTask: () => ({ mutateAsync: mockUpdateTask }),
  TASK_KEYS: { all: (id: string) => ['tasks', id] },
}))

vi.mock('../hooks/useSprints', () => ({
  useSprints: () => ({
    data: [
      { id: 'sprint-1', name: 'Sprint 1', isActive: true },
      { id: 'sprint-2', name: 'Sprint 2', isActive: false },
    ],
  }),
}))

// Mock Toast context
const mockToast = vi.fn()
vi.mock('../components/UI/Toast', () => ({
  useToast: () => mockToast,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

import type { Task } from '../api/types'

const sampleTask: Task = {
  id: 'task-1',
  projectId: 'proj-1',
  sprintId: 'sprint-1',
  title: 'Existing Task',
  priority: 'high',
  type: 'bug',
  assignee: 'alice',
  column: 'InProgress',
  position: 0,
  githubPrUrl: null,
  githubIssueUrl: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

type CreateProps = Extract<TaskModalProps, { mode: 'create' }>
type EditProps = Extract<TaskModalProps, { mode: 'edit' }>

function renderCreate(overrides: Partial<CreateProps> = {}) {
  return render(
    <TaskModal
      open={true}
      mode="create"
      projectId="proj-1"
      onClose={vi.fn()}
      {...overrides}
    />,
  )
}

function renderEdit(overrides: Partial<EditProps> = {}) {
  return render(
    <TaskModal
      open={true}
      mode="edit"
      task={sampleTask}
      onClose={vi.fn()}
      {...overrides}
    />,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TaskModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateTask.mockResolvedValue({ id: 'new-task' })
    mockUpdateTask.mockResolvedValue({ id: 'task-1' })
  })

  it('1. renders create modal with title "New Task"', () => {
    renderCreate()
    expect(screen.getByText('New Task')).toBeInTheDocument()
  })

  it('2. renders edit modal pre-filled with task data', () => {
    renderEdit()
    expect(screen.getByText('Edit Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument()
    // Assignee is now a select; 'alice' is a legacy string with no agentKey, so select shows blank/unassigned
    expect(screen.getByRole('combobox', { name: /assignee/i })).toBeInTheDocument()
    // priority and type selects
    expect(screen.getByDisplayValue('High')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bug')).toBeInTheDocument()
  })

  it('3. shows validation error when title is empty on submit', async () => {
    renderCreate()
    const saveBtn = screen.getByRole('button', { name: /save/i })
    await userEvent.click(saveBtn)
    expect(await screen.findByRole('alert')).toHaveTextContent('Title is required')
    expect(mockCreateTask).not.toHaveBeenCalled()
  })

  it('4. calls createTask on save in create mode', async () => {
    renderCreate({ defaultColumn: 'Backlog' })
    await userEvent.type(screen.getByPlaceholderText('Task title'), 'New Feature')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(mockCreateTask).toHaveBeenCalledOnce())
    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New Feature', column: 'Backlog', projectId: 'proj-1' }),
    )
  })

  it('5. calls updateTask on save in edit mode', async () => {
    renderEdit()
    const titleInput = screen.getByDisplayValue('Existing Task')
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, 'Updated Task')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledOnce())
    expect(mockUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'task-1', data: expect.objectContaining({ title: 'Updated Task' }) }),
    )
  })

  it('6. closes modal on cancel', async () => {
    const onClose = vi.fn()
    renderCreate({ onClose })
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
