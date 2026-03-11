import * as React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils'
import { agentsApi } from '../../api/agents'
import type { AgentSummary, AgentStatus } from '../../api/types'

const STATUS_DOT: Record<AgentStatus, string> = {
  active: 'bg-emerald-400',
  waiting: 'bg-amber-400',
  blocked: 'bg-rose-500',
  reviewing: 'bg-blue-400',
  idle: 'bg-slate-300',
}

const STATUS_LABEL_COLOR: Record<AgentStatus, string> = {
  active: 'text-emerald-600',
  waiting: 'text-amber-600',
  blocked: 'text-rose-600',
  reviewing: 'text-blue-600',
  idle: 'text-slate-400',
}

const LS_KEY = 'agentsPanel.expanded'

function loadExpanded(): boolean {
  try {
    const v = localStorage.getItem(LS_KEY)
    return v === 'true'
  } catch {
    return false
  }
}

export function ActiveAgentsPanel() {
  const [expanded, setExpanded] = React.useState<boolean>(loadExpanded)
  const [summary, setSummary] = React.useState<AgentSummary[]>([])

  React.useEffect(() => {
    agentsApi.getSummary().then(setSummary).catch(() => setSummary([]))
  }, [])

  function toggle() {
    setExpanded((prev) => {
      const next = !prev
      try { localStorage.setItem(LS_KEY, String(next)) } catch { /* noop */ }
      return next
    })
  }

  const visibleAgents = summary.filter(
    (a) => a.status !== 'idle' || a.activeTaskCount > 0
  )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Active Agents</span>
        <button
          onClick={toggle}
          aria-label={expanded ? 'Collapse agents panel' : 'Expand agents panel'}
          className="rounded p-1 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="mt-3 transition-all duration-200 animate-in fade-in slide-in-from-top-1">
          {visibleAgents.length === 0 ? (
            <div className="flex items-center justify-center py-4 text-sm text-slate-400">
              No active agents right now
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleAgents.map((agent) => {
                const isIdle = agent.status === 'idle'
                return (
                  <div
                    key={agent.agentKey}
                    className="flex items-center gap-3 py-2"
                  >
                    {/* Emoji */}
                    <span
                      role="img"
                      aria-label={`${agent.name} agent`}
                      className={cn(
                        'text-base leading-none w-5 text-center flex-shrink-0',
                        isIdle && '[filter:grayscale(1)]'
                      )}
                    >
                      {agent.emoji}
                    </span>

                    {/* Name */}
                    <span
                      className={cn(
                        'text-sm font-medium w-16 flex-shrink-0',
                        isIdle ? 'text-slate-400' : 'text-slate-800'
                      )}
                    >
                      {agent.name}
                    </span>

                    {/* Status dot + label */}
                    <span
                      className={cn('h-2 w-2 rounded-full flex-shrink-0', STATUS_DOT[agent.status])}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        'text-xs font-medium w-16 flex-shrink-0 capitalize',
                        STATUS_LABEL_COLOR[agent.status]
                      )}
                      aria-live="polite"
                    >
                      {agent.status}
                    </span>

                    {/* Task count pill */}
                    {agent.activeTaskCount > 0 && (
                      <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 flex-shrink-0">
                        {agent.activeTaskCount} task{agent.activeTaskCount !== 1 ? 's' : ''}
                      </span>
                    )}

                    {/* currentFocus */}
                    {agent.currentFocus && !isIdle && (
                      <span className="text-xs text-slate-500 truncate flex-1 min-w-0">
                        {agent.currentFocus}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
