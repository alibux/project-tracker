import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../UI/Modal'
import { Button } from '../UI/Button'
import { useCreateProject, useUpdateProject } from '../../hooks/useProjects'
import { useToast } from '../UI/Toast'
import type { Project } from '../../api/types'

interface ProjectModalProps {
  open: boolean
  onClose: () => void
  /** If provided, modal is in edit mode */
  project?: Project
}

export function ProjectModal({ open, onClose, project }: ProjectModalProps) {
  const isEdit = Boolean(project)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const toast = useToast()

  const createProject = useCreateProject()
  const updateProject = useUpdateProject()

  // Populate fields when editing
  React.useEffect(() => {
    if (open) {
      setName(project?.name ?? '')
      setDescription(project?.description ?? '')
    }
  }, [open, project])

  const isPending = createProject.isPending || updateProject.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    try {
      if (isEdit && project) {
        await updateProject.mutateAsync({ id: project.id, data: { name: trimmedName, description: description.trim() || null } })
        toast({ title: `"${trimmedName}" updated` })
      } else {
        await createProject.mutateAsync({ name: trimmedName, description: description.trim() || null })
        toast({ title: `"${trimmedName}" created` })
      }
      onClose()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Something went wrong', variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Rename project' : 'New project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="proj-name" className="text-sm font-medium text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="proj-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Tracker"
              maxLength={255}
              required
              autoFocus
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="proj-desc" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
              rows={3}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
