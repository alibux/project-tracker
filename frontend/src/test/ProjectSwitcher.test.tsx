import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProjectSwitcher } from '../components/Projects/ProjectSwitcher'
import { ToastContainer } from '../components/UI/Toast'
import * as projectsApi from '../api/projects'
import type { Project } from '../api/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: crypto.randomUUID(),
    name: 'Test Project',
    description: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function renderSwitcher() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastContainer>
        <ProjectSwitcher />
      </ToastContainer>
    </QueryClientProvider>,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('ProjectSwitcher', () => {
  it('shows loading state initially', () => {
    vi.spyOn(projectsApi.projectsApi, 'list').mockReturnValue(new Promise(() => {}))
    renderSwitcher()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders project list', async () => {
    const projects = [makeProject({ name: 'Alpha' }), makeProject({ name: 'Beta' })]
    vi.spyOn(projectsApi.projectsApi, 'list').mockResolvedValue(projects)

    renderSwitcher()

    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument()
      expect(screen.getByText('Beta')).toBeInTheDocument()
    })
  })

  it('shows empty state when no projects', async () => {
    vi.spyOn(projectsApi.projectsApi, 'list').mockResolvedValue([])
    renderSwitcher()
    await waitFor(() => expect(screen.getByText('No projects yet')).toBeInTheDocument())
  })

  it('shows error state on fetch failure', async () => {
    vi.spyOn(projectsApi.projectsApi, 'list').mockRejectedValue(new Error('Network error'))
    renderSwitcher()
    await waitFor(() => expect(screen.getByText('Failed to load projects')).toBeInTheDocument())
  })

  it('opens create modal when New Project is clicked', async () => {
    vi.spyOn(projectsApi.projectsApi, 'list').mockResolvedValue([])
    renderSwitcher()

    await waitFor(() => screen.getByText('No projects yet'))
    await userEvent.click(screen.getByText('New Project'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('New project')).toBeInTheDocument()
  })

  it('creates a project via the modal', async () => {
    const newProject = makeProject({ name: 'My New Project' })
    vi.spyOn(projectsApi.projectsApi, 'list').mockResolvedValue([])
    const createSpy = vi.spyOn(projectsApi.projectsApi, 'create').mockResolvedValue(newProject)

    renderSwitcher()
    await waitFor(() => screen.getByText('No projects yet'))

    await userEvent.click(screen.getByText('New Project'))
    await userEvent.type(screen.getByLabelText(/name/i), 'My New Project')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(createSpy).toHaveBeenCalledWith({
      name: 'My New Project',
      description: null,
    }))
  })
})
