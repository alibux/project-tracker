import * as React from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { BoardColumn } from './BoardColumn'
import { TaskCard } from './TaskCard'
import { useBoardStore } from '../../store/boardStore'
import { useTasks, useDeleteTask, useMoveTask } from '../../hooks/useTasks'
import { useToast } from '../UI/Toast'
import { COLUMNS } from '../../data/constants'
import type { Task, Column } from '../../api/types'

interface KanbanBoardProps {
  projectId: string
  sprintId?: string | null
  onAddTask: (column: string) => void
  onTaskClick: (task: Task) => void
  agentFilter?: string | null
}

export function KanbanBoard({ projectId, sprintId, onAddTask, onTaskClick, agentFilter }: KanbanBoardProps) {
  const { data: tasks = [], isLoading, isError } = useTasks(projectId, sprintId)
  const moveTask = useMoveTask(projectId)
  const deleteTask = useDeleteTask(projectId)
  const toast = useToast()

  const moveTaskOptimistic = useBoardStore((s) => s.moveTaskOptimistic)
  const revertTask = useBoardStore((s) => s.revertTask)
  const optimisticTasks = useBoardStore((s) => s.optimisticTasks)

  const [activeTask, setActiveTask] = React.useState<Task | null>(null)

  // Merge server tasks with any optimistic overrides
  const mergedTasks: Task[] = tasks.map((t) => ({
    ...t,
    ...(optimisticTasks[t.id] ?? {}),
  }))

  // Group tasks by column, sorted by position (filtered by agent if selected)
  const tasksByColumn = React.useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const col of COLUMNS) map[col] = []
    for (const task of mergedTasks) {
      if (agentFilter && task.assigneeAgentKey !== agentFilter) continue
      if (map[task.column]) map[task.column].push(task)
    }
    for (const col of COLUMNS) map[col].sort((a, b) => a.position - b.position)
    return map
  }, [mergedTasks, agentFilter])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    const task = mergedTasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const task = mergedTasks.find((t) => t.id === active.id)
    if (!task) return

    // Determine target column: over could be a column id or another task id
    const overIsColumn = COLUMNS.includes(over.id as Column)
    const targetColumn: Column = overIsColumn
      ? (over.id as Column)
      : (mergedTasks.find((t) => t.id === over.id)?.column ?? task.column)

    if (targetColumn === task.column) return

    // Optimistic update
    moveTaskOptimistic(task.id, { column: targetColumn })

    try {
      await moveTask.mutateAsync({ id: task.id, data: { column: targetColumn } })
    } catch (err) {
      revertTask(task.id)
      toast({ title: err instanceof Error ? err.message : 'Move failed — reverted', variant: 'error' })
    }
  }

  async function handleDelete(task: Task) {
    const confirmed = window.confirm(`Delete "${task.title}"?`)
    if (!confirmed) return
    try {
      await deleteTask.mutateAsync(task.id)
      toast({ title: `"${task.title}" deleted` })
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Delete failed', variant: 'error' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 p-6 overflow-x-auto">
        {COLUMNS.map((col) => (
          <div key={col} className="w-72 shrink-0 rounded-xl bg-slate-100 h-48 animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 text-sm text-red-500">Failed to load tasks. Please try again.</div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 overflow-x-auto h-full">
        {COLUMNS.map((col) => (
          <div key={col} className="max-h-[calc(100vh-200px)] flex flex-col">
          <BoardColumn
            column={col}
            tasks={tasksByColumn[col] ?? []}
            onAddTask={() => onAddTask(col)}
            onTaskClick={onTaskClick}
            onTaskDelete={handleDelete}
          />
          </div>
        ))}
      </div>

      {/* Drag overlay — renders the card being dragged */}
      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            onClick={() => {}}
            onDelete={() => {}}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
