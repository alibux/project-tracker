import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActiveAgentsPanel } from '../components/Agents/ActiveAgentsPanel'
import type { AgentSummary } from '../api/types'

// Mock the agents API
vi.mock('../api/agents', () => ({
  agentsApi: {
    getSummary: vi.fn(),
  },
}))

import { agentsApi } from '../api/agents'

const idleSummary: AgentSummary[] = [
  { agentKey: 'frontend', name: 'Pixel', emoji: '🎨', status: 'idle', activeTaskCount: 0, currentFocus: null },
  { agentKey: 'backend', name: 'Bastion', emoji: '🏰', status: 'idle', activeTaskCount: 0, currentFocus: null },
]

const _activeSummary: AgentSummary[] = [
  { agentKey: 'frontend', name: 'Pixel', emoji: '🎨', status: 'active', activeTaskCount: 2, currentFocus: 'Building chips' },
]
void _activeSummary // suppress unused warning

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('ActiveAgentsPanel', () => {
  it('panel is collapsed by default', () => {
    vi.mocked(agentsApi.getSummary).mockResolvedValue([])
    render(<ActiveAgentsPanel />)
    // The content area (agent rows or empty state) should not be visible
    expect(screen.queryByText('No active agents right now')).toBeNull()
  })

  it('expands on chevron click', async () => {
    vi.mocked(agentsApi.getSummary).mockResolvedValue(idleSummary)
    const user = userEvent.setup()
    render(<ActiveAgentsPanel />)
    const btn = screen.getByRole('button', { name: /expand/i })
    await user.click(btn)
    expect(await screen.findByText('No active agents right now')).toBeTruthy()
  })

  it('shows "No active agents right now" when all agents are idle', async () => {
    vi.mocked(agentsApi.getSummary).mockResolvedValue(idleSummary)
    const user = userEvent.setup()
    render(<ActiveAgentsPanel />)
    await user.click(screen.getByRole('button', { name: /expand/i }))
    expect(await screen.findByText('No active agents right now')).toBeTruthy()
  })
})
