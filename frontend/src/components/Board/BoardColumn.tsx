import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { TaskCard } from './TaskCard'
import { cn } from '../../lib/utils'
import { COLUMN_LABELS } from '../../data/constants'
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

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          title={`Add task to ${label}`}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 rounded-xl p-2 min-h-[200px] transition-colors',
          isOver ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-slate-100/60',
        )}
      >
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
    </div>
  )
}
