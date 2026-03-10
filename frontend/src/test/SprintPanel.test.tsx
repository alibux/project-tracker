import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SprintPanel } from '../components/Sprints/SprintPanel'
import type { Sprint } from '../api/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockSprints: Sprint[] = [
  {
    id: 'sprint-1',
    projectId: 'proj-1',
    name: 'Sprint 1',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-01-14T00:00:00Z',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'sprint-2',
    projectId: 'proj-1',
    name: 'Sprint 2',
    startDate: null,
    endDate: null,
    isActive: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockActivate = vi.fn()
const mockDelete = vi.fn()

vi.mock('../hooks/useSprints', () => ({
  useSprints: vi.fn(() => ({ data: mockSprints, isLoading: false })),
  useCreateSprint: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateSprint: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteSprint: vi.fn(() => ({ mutateAsync: mockDelete, isPending: false })),
  useActivateSprint: vi.fn(() => ({ mutateAsync: mockActivate, isPending: false })),
}))

const mockToast = vi.fn()
vi.mock('../components/UI/Toast', () => ({
  useToast: () => mockToast,
}))

// Mock SprintModal so we can assert it opens
vi.mock('../components/Sprints/SprintModal', () => ({
  SprintModal: ({ mode, open }: { mode: string; open: boolean }) =>
    open ? <div data-testid="sprint-modal" data-mode={mode} /> : null,
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SprintPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockActivate.mockResolvedValue(undefined)
    mockDelete.mockResolvedValue(undefined)
  })

  it('renders list of sprints with name, dates, and active badge', () => {
    render(<SprintPanel projectId="proj-1" />)

    expect(screen.getByText('Sprint 1')).toBeInTheDocument()
    expect(screen.getByText('Sprint 2')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    // Sprint 2 has no dates — both dashes
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0)
  })

  it('shows "No sprints yet" when list is empty', async () => {
    const { useSprints } = await import('../hooks/useSprints')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useSprints).mockReturnValueOnce({ data: [], isLoading: false } as unknown as ReturnType<typeof useSprints>)

    render(<SprintPanel projectId="proj-1" />)
    expect(screen.getByText('No sprints yet')).toBeInTheDocument()
  })

  it('opens SprintModal in create mode when "New Sprint" clicked', async () => {
    const user = userEvent.setup()
    render(<SprintPanel projectId="proj-1" />)

    await user.click(screen.getByRole('button', { name: /new sprint/i }))

    const modal = screen.getByTestId('sprint-modal')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveAttribute('data-mode', 'create')
  })

  it('opens SprintModal in edit mode when edit icon clicked', async () => {
    const user = userEvent.setup()
    render(<SprintPanel projectId="proj-1" />)

    const editButtons = screen.getAllByRole('button', { name: /edit sprint/i })
    await user.click(editButtons[0])

    const modal = screen.getByTestId('sprint-modal')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveAttribute('data-mode', 'edit')
  })

  it('calls activate when Activate button clicked', async () => {
    const user = userEvent.setup()
    render(<SprintPanel projectId="proj-1" />)

    // Sprint 2 is not active — should have Activate button
    await user.click(screen.getByRole('button', { name: /activate/i }))

    await waitFor(() => {
      expect(mockActivate).toHaveBeenCalledWith('sprint-2')
    })
    expect(mockToast).toHaveBeenCalledWith({ title: 'Sprint activated' })
  })

  it('shows inline confirmation before delete, calls delete on confirm', async () => {
    const user = userEvent.setup()
    render(<SprintPanel projectId="proj-1" />)

    const deleteButtons = screen.getAllByRole('button', { name: /delete sprint/i })
    await user.click(deleteButtons[0])

    // Confirmation text should appear
    expect(screen.getByText(/delete sprint\? tasks will be unassigned/i)).toBeInTheDocument()

    // Confirm delete
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('sprint-1')
    })
    expect(mockToast).toHaveBeenCalledWith({ title: 'Sprint deleted' })
  })
})
