import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentChip } from '../components/Agents/AgentChip'

describe('AgentChip', () => {
  it('renders emoji and name for a known agent', () => {
    render(<AgentChip agentKey="frontend" />)
    expect(screen.getByText('🎨')).toBeTruthy()
    expect(screen.getByText('Pixel')).toBeTruthy()
  })

  it('renders "Unassigned" for unknown agent key', () => {
    render(<AgentChip agentKey="unknown-agent-xyz" />)
    expect(screen.getByText('Unassigned')).toBeTruthy()
  })

  it('shows green dot for active status', () => {
    const { container } = render(<AgentChip agentKey="frontend" showStatus status="active" />)
    const dot = container.querySelector('[role="status"]')
    expect(dot).toBeTruthy()
    expect(dot!.className).toContain('bg-emerald-400')
  })

  it('shows red dot for blocked status', () => {
    const { container } = render(<AgentChip agentKey="frontend" showStatus status="blocked" />)
    const dot = container.querySelector('[role="status"]')
    expect(dot).toBeTruthy()
    expect(dot!.className).toContain('bg-red-500')
  })

  it('renders Oracle with purple accent and 🔮 emoji', () => {
    const { container } = render(<AgentChip agentKey="research-analytics" />)
    expect(screen.getByText('🔮')).toBeTruthy()
    expect(screen.getByText('Oracle')).toBeTruthy()
    const chip = container.firstElementChild
    expect(chip!.className).toContain('bg-purple-50')
    expect(chip!.className).toContain('text-purple-700')
    expect(chip!.className).toContain('border-purple-200')
  })

  it('shows amber dot for reviewing status', () => {
    const { container } = render(<AgentChip agentKey="research-analytics" showStatus status="reviewing" />)
    const dot = container.querySelector('[role="status"]')
    expect(dot).toBeTruthy()
    expect(dot!.className).toContain('bg-amber-400')
  })
})
