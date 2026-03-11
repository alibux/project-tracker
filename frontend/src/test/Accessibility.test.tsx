import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentChip } from '../components/Agents/AgentChip'
import { ActiveAgentsPanel } from '../components/Agents/ActiveAgentsPanel'

// Mock agentsApi
vi.mock('../api/agents', () => ({
  agentsApi: {
    getSummary: vi.fn().mockResolvedValue([]),
  },
}))

describe('Accessibility', () => {
  describe('AgentChip', () => {
    it('renders emoji with role="img" and aria-label', () => {
      render(<AgentChip agentKey="frontend" />)
      const emojiSpan = screen.getByRole('img', { name: /Pixel agent/i })
      expect(emojiSpan).toBeInTheDocument()
      expect(emojiSpan).toHaveAttribute('aria-label', 'Pixel agent')
    })

    it('renders all known agents with aria-label on emoji', () => {
      const agentKeys = ['main', 'backend', 'frontend', 'ux', 'qa']
      for (const key of agentKeys) {
        const { unmount } = render(<AgentChip agentKey={key} />)
        const imgs = document.querySelectorAll('[role="img"]')
        expect(imgs.length).toBeGreaterThan(0)
        for (const img of imgs) {
          expect(img).toHaveAttribute('aria-label')
        }
        unmount()
      }
    })
  })

  describe('ActiveAgentsPanel', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      localStorage.clear()
    })

    it('toggle button has accessible label when collapsed', () => {
      render(<ActiveAgentsPanel />)
      const btn = screen.getByRole('button', { name: /expand agents panel/i })
      expect(btn).toBeInTheDocument()
    })

    it('toggle button has accessible label when expanded', async () => {
      // Start expanded
      localStorage.setItem('agentsPanel.expanded', 'true')
      render(<ActiveAgentsPanel />)
      const btn = screen.getByRole('button', { name: /collapse agents panel/i })
      expect(btn).toBeInTheDocument()
    })
  })
})
