import { apiFetch } from './client'
import type { AgentSummary } from './types'

export const agentsApi = {
  getSummary: () => apiFetch<AgentSummary[]>('/api/agents/summary'),
}
