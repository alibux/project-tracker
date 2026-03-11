import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GithubIcon, MoreVertical, Trash2 } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Badge } from '../UI/Badge'
import { AgentChip } from '../Agents/AgentChip'
import { cn } from '../../lib/utils'
import { PRIORITY_COLORS, TYPE_COLORS } from '../../data/constants'
import type { Task } from '../../api/types'

interface TaskCardProps {
  task: Task
  onClick: () => void
  onDelete: () => void
  isDragging?: boolean
}

export function TaskCard({ task, onClick, onDelete, isDragging = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: sortableDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragging = isDragging || sortableDragging

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm cursor-pointer select-none',
        'hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1',
        dragging && 'opacity-50 shadow-lg ring-2 ring-blue-400',
      )}
      onClick={onClick}
      aria-grabbed={dragging}
      {...attributes}
      {...listeners}
    >
      {/* Title */}
      <p className="text-sm font-medium text-slate-800 leading-snug mb-2 pr-6 min-w-0">{task.title}</p>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1 min-w-0">
        {task.assigneeAgentKey && (
          <AgentChip agentKey={task.assigneeAgentKey} size="sm" />
        )}
        <Badge
          label={task.priority}
          className={cn('text-xs', PRIORITY_COLORS[task.priority] ?? 'bg-slate-100 text-slate-600')}
        />
        <Badge
          label={task.type}
          className={cn('text-xs', TYPE_COLORS[task.type] ?? 'bg-slate-100 text-slate-600')}
        />
        {task.assignee && !task.assigneeAgentKey && (
          <span className="ml-auto text-xs text-slate-400">{task.assignee}</span>
        )}
      </div>

      {/* GitHub link */}
      {task.githubPrUrl && (
        <a
          href={task.githubPrUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 right-8 text-slate-300 hover:text-slate-600 transition-colors"
          title="View on GitHub"
        >
          <GithubIcon className="h-3.5 w-3.5" />
        </a>
      )}

      {/* Kebab menu */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="absolute top-2 right-2 rounded p-0.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:opacity-100"
            onClick={(e) => e.stopPropagation()}
            aria-label="Task actions"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[120px] rounded-md border border-slate-200 bg-white py-1 shadow-lg"
            sideOffset={4}
          >
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 outline-none"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
