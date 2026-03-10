import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../UI/Modal'
import { Button } from '../UI/Button'
import { useToast } from '../UI/Toast'
import { useCreateSprint, useUpdateSprint } from '../../hooks/useSprints'
import type { Sprint, CreateSprintRequest, UpdateSprintRequest } from '../../api/types'

interface SprintModalCreateProps {
  open: boolean
  mode: 'create'
  projectId: string
  onClose: () => void
}

interface SprintModalEditProps {
  open: boolean
  mode: 'edit'
  projectId: string
  sprint: Sprint
  onClose: () => void
}

type SprintModalProps = SprintModalCreateProps | SprintModalEditProps

function formatDateInput(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.substring(0, 10)
}

export function SprintModal(props: SprintModalProps) {
  const { open, mode, projectId, onClose } = props
  const sprint = mode === 'edit' ? props.sprint : null

  const [name, setName] = React.useState(sprint?.name ?? '')
  const [startDate, setStartDate] = React.useState(formatDateInput(sprint?.startDate ?? null))
  const [endDate, setEndDate] = React.useState(formatDateInput(sprint?.endDate ?? null))
  const [nameError, setNameError] = React.useState('')

  const toast = useToast()
  const createSprint = useCreateSprint(projectId)
  const updateSprint = useUpdateSprint(projectId)

  // Reset form when modal opens/sprint changes
  React.useEffect(() => {
    if (open) {
      setName(sprint?.name ?? '')
      setStartDate(formatDateInput(sprint?.startDate ?? null))
      setEndDate(formatDateInput(sprint?.endDate ?? null))
      setNameError('')
    }
  }, [open, sprint])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Sprint name is required')
      return
    }
    setNameError('')

    const payload: CreateSprintRequest | UpdateSprintRequest = {
      name: name.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
    }

    try {
      if (mode === 'create') {
        await createSprint.mutateAsync(payload as CreateSprintRequest)
        toast({ title: 'Sprint created' })
      } else if (sprint) {
        await updateSprint.mutateAsync({ id: sprint.id, data: payload as UpdateSprintRequest })
        toast({ title: 'Sprint updated' })
      }
      onClose()
    } catch {
      toast({ title: 'Failed to save sprint', variant: 'error' })
    }
  }

  const isPending = createSprint.isPending || updateSprint.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New Sprint' : 'Edit Sprint'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="sprint-name">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="sprint-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint name"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="sprint-start">
              Start Date
            </label>
            <input
              id="sprint-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="sprint-end">
              End Date
            </label>
            <input
              id="sprint-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
