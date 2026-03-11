import { cn } from '../../lib/utils'

export type AgentStatus = 'active' | 'waiting' | 'blocked' | 'reviewing' | 'idle'

interface AgentInfo {
  emoji: string
  name: string
  bg: string
  text: string
  border: string
}

const AGENTS: Record<string, AgentInfo> = {
  owner: { emoji: '🦸', name: 'Rehan', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
  main: { emoji: '🦞', name: 'Alfred', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  backend: { emoji: '🏰', name: 'Bastion', bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
  frontend: { emoji: '🎨', name: 'Pixel', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  ux: { emoji: '🌿', name: 'Sage', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  qa: { emoji: '👁️', name: 'Wraith', bg: 'bg-stone-100', text: 'text-stone-600', border: 'border-stone-300' },
  'research-analytics': { emoji: '🔮', name: 'Oracle', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'content-creator': { emoji: '⚡', name: 'Spark', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'platform-optimizer': { emoji: '🔁', name: 'Shift', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  scheduler: { emoji: '⏱️', name: 'Chrono', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'asset-generator': { emoji: '🖼️', name: 'Flux', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
}

const STATUS_DOT: Record<AgentStatus, string> = {
  active: 'bg-emerald-400',
  waiting: 'bg-amber-400',
  blocked: 'bg-red-500',
  reviewing: 'bg-amber-400',
  idle: 'bg-gray-300',
}

interface AgentChipProps {
  agentKey: string
  size?: 'sm' | 'md'
  showStatus?: boolean
  status?: AgentStatus
}

export function AgentChip({ agentKey, size = 'md', showStatus = false, status = 'idle' }: AgentChipProps) {
  const agent = AGENTS[agentKey]

  if (!agent) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border bg-slate-50 border-slate-200 text-slate-500 px-2.5 py-1 text-xs font-medium select-none">
        <span>Unassigned</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium select-none',
        agent.bg,
        agent.text,
        agent.border,
        size === 'sm' && 'px-2 py-0.5',
      )}
    >
      <span aria-hidden="true" className="text-sm leading-none">{agent.emoji}</span>
      <span className="leading-none">{agent.name}</span>
      {showStatus && (
        <span
          className={cn('h-2 w-2 rounded-full flex-shrink-0', STATUS_DOT[status])}
          role="status"
          aria-label={status}
        />
      )}
    </span>
  )
}

export { AGENTS }
export type { AgentInfo }
