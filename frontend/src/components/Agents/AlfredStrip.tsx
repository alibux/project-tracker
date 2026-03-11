import type { AgentSummary } from '../../api/types'

interface AlfredStripProps {
  summary: AgentSummary[]
}

export function AlfredStrip({ summary }: AlfredStripProps) {
  const activeTasks = summary.reduce((sum, a) => sum + a.activeTaskCount, 0)
  const activeAgentNames = summary
    .filter((a) => a.activeTaskCount > 0)
    .map((a) => a.name)

  if (activeTasks === 0 || activeAgentNames.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 mb-3 text-sm text-slate-500">
        🦞 Alfred — system idle
      </div>
    )
  }

  const namesText = activeAgentNames.length === 1
    ? activeAgentNames[0]
    : activeAgentNames.slice(0, -1).join(', ') + ' and ' + activeAgentNames[activeAgentNames.length - 1]

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 mb-3 text-sm text-indigo-700">
      🦞 Alfred coordinating {activeTasks} active task{activeTasks !== 1 ? 's' : ''} across {namesText}.
    </div>
  )
}
