import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { TaskCard } from './TaskCard'
import { cn } from '../../lib/utils'
import { COLUMN_LABELS, COLUMN_STYLES } from '../../data/constants'
import type { Task, Column } from '../../api/types'

interface BoardColumnProps {
  column: Column
  tasks: Task[]
  onAddTask: () => void
  onTaskClick: (task: Task) => void
  onTaskDelete: (task: Task) => void
}

export function BoardColumn({ column, tasks, onAddTask, onTaskClick, onTaskDelete }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column })

  const label = COLUMN_LABELS[column]
  const styles = COLUMN_STYLES[column]

  return (
    <div className="flex flex-col w-72 shrink-0 rounded-3xl border border-slate-200 bg-white/70 shadow-sm overflow-hidden">
      {/* Column header */}
      <div className={cn('flex items-center justify-between px-4 py-3', styles.headerBg)}>
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full shrink-0', styles.dot)} />
          <h3 className={cn('text-sm font-bold', styles.headerText)}>{label}</h3>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', styles.badgeBg, styles.badgeText)}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          title={`Add task to ${label}`}
          className={cn('rounded-lg p-1 transition-colors', styles.headerText, 'hover:bg-white/50')}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col p-3 flex-1 transition-colors',
          isOver ? styles.dropOver : 'bg-transparent',
        )}
      >
        {/* Scrollable card list */}
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] flex flex-col gap-2 min-h-[200px]">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                onDelete={() => onTaskDelete(task)}
              />
            ))}
          </SortableContext>

          {tasks.length === 0 && (
            <p className="flex-1 flex items-center justify-center text-xs text-slate-400 py-8">
              No tasks
            </p>
          )}
        </div>

        {/* Add task affordance — always visible */}
        <button
          onClick={onAddTask}
          className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 py-2 text-xs text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors"
        >
          <Plus className="h-3 w-3 inline mr-1" />
          Add task
        </button>
      </div>
    </div>
  )
}
