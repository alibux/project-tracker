import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskCard } from '../components/Board/TaskCard'
import type { Task } from '../api/types'

// Mock dnd-kit so jsdom doesn't choke on pointer sensors
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => undefined,
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))
vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const baseTask: Task = {
  id: 'task-1',
  projectId: 'proj-1',
  sprintId: null,
  title: 'Fix the login bug',
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

function renderCard(overrides: Partial<Task> = {}, onClick = vi.fn(), onDelete = vi.fn()) {
  const task: Task = { ...baseTask, ...overrides }
  return { onClick, onDelete, ...render(<TaskCard task={task} onClick={onClick} onDelete={onDelete} />) }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TaskCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. renders task title', () => {
    renderCard()
    expect(screen.getByText('Fix the login bug')).toBeInTheDocument()
  })

  it('2. renders priority badge with correct label', () => {
    renderCard({ priority: 'urgent' })
    expect(screen.getByText('urgent')).toBeInTheDocument()
  })

  it('3. renders type badge with correct label', () => {
    renderCard({ type: 'feature' })
    expect(screen.getByText('feature')).toBeInTheDocument()
  })

  it('4. renders GitHub PR icon/link when githubPrUrl is set', () => {
    renderCard({ githubPrUrl: 'https://github.com/owner/repo/pull/1' })
    const link = screen.getByTitle('View on GitHub')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://github.com/owner/repo/pull/1')
  })

  it('5. does NOT render GitHub icon when githubPrUrl is null', () => {
    renderCard({ githubPrUrl: null })
    expect(screen.queryByTitle('View on GitHub')).not.toBeInTheDocument()
  })

  it('6. clicking the card triggers onClick callback', async () => {
    const onClick = vi.fn()
    renderCard({}, onClick)
    // The card div is the container — find by text then click parent
    await userEvent.click(screen.getByText('Fix the login bug'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('7. clicking Delete in kebab menu triggers onDelete callback', async () => {
    const onDelete = vi.fn()
    renderCard({}, vi.fn(), onDelete)
    // Open kebab menu
    const trigger = screen.getByLabelText('Task actions')
    await userEvent.click(trigger)
    // Click delete item
    const deleteItem = await screen.findByText('Delete')
    await userEvent.click(deleteItem)
    expect(onDelete).toHaveBeenCalledOnce()
  })
})
