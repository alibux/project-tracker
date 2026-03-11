import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../UI/Modal'
import { Button } from '../UI/Button'
import { useToast } from '../UI/Toast'
import { useCreateTask, useUpdateTask } from '../../hooks/useTasks'
import { useSprints } from '../../hooks/useSprints'
import { COLUMNS, COLUMN_LABELS, PRIORITIES, TASK_TYPES } from '../../data/constants'
import type { Column, Priority, TaskType } from '../../data/constants'
import type { Task } from '../../api/types'

const AGENT_OPTIONS = [
  { key: 'main', emoji: '🦞', name: 'Alfred', role: 'Orchestrator' },
  { key: 'backend', emoji: '🏰', name: 'Bastion', role: 'Backend engineer' },
  { key: 'frontend', emoji: '🎨', name: 'Pixel', role: 'Frontend engineer' },
  { key: 'ux', emoji: '🌿', name: 'Sage', role: 'UX designer' },
  { key: 'qa', emoji: '👁️', name: 'Wraith', role: 'QA engineer' },
  { key: 'research-analytics', emoji: '🔮', name: 'Oracle', role: 'Research & analytics' },
  { key: 'content-creator', emoji: '⚡', name: 'Spark', role: 'Content creator' },
  { key: 'platform-optimizer', emoji: '🔁', name: 'Shift', role: 'Platform optimizer' },
  { key: 'scheduler', emoji: '⏱️', name: 'Chrono', role: 'Scheduler' },
  { key: 'asset-generator', emoji: '🖼️', name: 'Flux', role: 'Asset generator' },
]

interface CreateMode {
  mode: 'create'
  projectId: string
  defaultColumn?: Column
}

interface EditMode {
  mode: 'edit'
  task: Task
}

export type TaskModalProps = {
  open: boolean
  onClose: () => void
  onSaved?: () => void
} & (CreateMode | EditMode)

export function TaskModal(props: TaskModalProps) {
  const { open, onClose, onSaved } = props

  const projectId = props.mode === 'create' ? props.projectId : props.task.projectId

  const { data: sprints = [] } = useSprints(projectId)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask(projectId)
  const toast = useToast()

  // Derive initial form state
  const initial = React.useMemo(() => {
    if (props.mode === 'edit') {
      return {
        title: props.task.title,
        priority: props.task.priority as Priority,
        type: props.task.type as TaskType,
        assignee: props.task.assignee ?? '',
        assigneeAgentKey: props.task.assigneeAgentKey ?? '',
        column: props.task.column as Column,
        sprintId: props.task.sprintId ?? '',
      }
    }
    return {
      title: '',
      priority: 'medium' as Priority,
      type: 'feature' as TaskType,
      assignee: '',
      assigneeAgentKey: '',
      column: (props.defaultColumn ?? 'Backlog') as Column,
      sprintId: '',
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const [form, setForm] = React.useState(initial)
  const [titleError, setTitleError] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  // Reset when modal re-opens
  React.useEffect(() => {
    if (open) {
      setForm(initial)
      setTitleError('')
    }
  }, [open, initial])

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'title') setTitleError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setTitleError('Title is required')
      return
    }

    setSaving(true)
    try {
      if (props.mode === 'create') {
        await createTask.mutateAsync({
          projectId,
          title: form.title.trim(),
          priority: form.priority,
          type: form.type,
          assignee: form.assignee || null,
          column: form.column,
          sprintId: form.sprintId || null,
        })
        toast({ title: 'Task created' })
      } else {
        await updateTask.mutateAsync({
          id: props.task.id,
          data: {
            title: form.title.trim(),
            priority: form.priority,
            type: form.type,
            assignee: form.assignee || null,
            column: form.column,
            sprintId: form.sprintId || null,
          },
        })
        toast({ title: 'Task updated' })
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Save failed',
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.mode === 'create' ? 'New Task' : 'Edit Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="task-title">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Task title"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {titleError && (
              <span className="text-xs text-red-500" role="alert">{titleError}</span>
            )}
          </div>

          {/* Priority + Type row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={form.priority}
                onChange={(e) => update('priority', e.target.value as Priority)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="task-type">Type</label>
              <select
                id="task-type"
                value={form.type}
                onChange={(e) => update('type', e.target.value as TaskType)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="task-assignee">Assignee</label>
            <select
              id="task-assignee"
              value={form.assigneeAgentKey}
              onChange={(e) => {
                const agentKey = e.target.value
                const agent = AGENT_OPTIONS.find((a) => a.key === agentKey)
                if (agent) {
                  setForm((prev) => ({
                    ...prev,
                    assigneeAgentKey: agentKey,
                    assignee: agent.name,
                  }))
                } else {
                  setForm((prev) => ({
                    ...prev,
                    assigneeAgentKey: '',
                    assignee: '',
                  }))
                }
              }}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">— Unassigned</option>
              {AGENT_OPTIONS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.emoji} {a.name} — {a.role}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              If left blank, Alfred may assign the best agent automatically.
            </p>
          </div>

          {/* Column + Sprint row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="task-column">Column</label>
              <select
                id="task-column"
                value={form.column}
                onChange={(e) => update('column', e.target.value as Column)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {COLUMNS.map((c) => (
                  <option key={c} value={c}>{COLUMN_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="task-sprint">Sprint</label>
              <select
                id="task-sprint"
                value={form.sprintId}
                onChange={(e) => update('sprintId', e.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">No sprint</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
