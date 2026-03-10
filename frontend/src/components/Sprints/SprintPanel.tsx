import * as React from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../UI/Button'
import { Badge } from '../UI/Badge'
import { useToast } from '../UI/Toast'
import { useSprints, useDeleteSprint, useActivateSprint } from '../../hooks/useSprints'
import { SprintModal } from './SprintModal'
import type { Sprint } from '../../api/types'

interface SprintPanelProps {
  projectId: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

type ModalState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; sprint: Sprint }

export function SprintPanel({ projectId }: SprintPanelProps) {
  const { data: sprints, isLoading } = useSprints(projectId)
  const deleteSprint = useDeleteSprint(projectId)
  const activateSprint = useActivateSprint(projectId)
  const toast = useToast()

  const [modal, setModal] = React.useState<ModalState>({ open: false })
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)

  async function handleActivate(id: string) {
    try {
      await activateSprint.mutateAsync(id)
      toast({ title: 'Sprint activated' })
    } catch {
      toast({ title: 'Failed to activate sprint', variant: 'error' })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSprint.mutateAsync(id)
      setConfirmDeleteId(null)
      toast({ title: 'Sprint deleted' })
    } catch {
      toast({ title: 'Failed to delete sprint', variant: 'error' })
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">Sprints</h2>
        <Button size="sm" onClick={() => setModal({ open: true, mode: 'create' })}>
          + New Sprint
        </Button>
      </div>

      {/* Sprint list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-md bg-slate-100 animate-pulse" />
            ))}
          </>
        )}

        {!isLoading && (!sprints || sprints.length === 0) && (
          <p className="text-sm text-slate-400 text-center mt-8">No sprints yet</p>
        )}

        {!isLoading && sprints && sprints.map((sprint) => (
          <div
            key={sprint.id}
            className="rounded-md border border-slate-200 p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-slate-900 truncate">{sprint.name}</span>
                {sprint.isActive && (
                  <Badge label="Active" className="bg-green-100 text-green-700 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!sprint.isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleActivate(sprint.id)}
                    disabled={activateSprint.isPending}
                  >
                    Activate
                  </Button>
                )}
                <button
                  aria-label="Edit sprint"
                  onClick={() => setModal({ open: true, mode: 'edit', sprint })}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  aria-label="Delete sprint"
                  onClick={() => setConfirmDeleteId(sprint.id)}
                  className="p-1 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
            </div>

            {/* Inline delete confirmation */}
            {confirmDeleteId === sprint.id && (
              <div className="rounded-md bg-red-50 border border-red-200 p-2 flex flex-col gap-2">
                <p className="text-xs text-red-700">Delete sprint? Tasks will be unassigned.</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(sprint.id)}
                    disabled={deleteSprint.isPending}
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal.open && modal.mode === 'create' && (
        <SprintModal
          open
          mode="create"
          projectId={projectId}
          onClose={() => setModal({ open: false })}
        />
      )}
      {modal.open && modal.mode === 'edit' && (
        <SprintModal
          open
          mode="edit"
          projectId={projectId}
          sprint={modal.sprint}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
