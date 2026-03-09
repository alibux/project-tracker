import * as React from 'react'
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react'
import { useProjects, useDeleteProject } from '../../hooks/useProjects'
import { useBoardStore } from '../../store/boardStore'
import { useToast } from '../UI/Toast'
import { Button } from '../UI/Button'
import { ProjectModal } from './ProjectModal'
import { cn } from '../../lib/utils'
import type { Project } from '../../api/types'

export function ProjectSwitcher() {
  const { data: projects = [], isLoading, isError } = useProjects()
  const currentProjectId = useBoardStore((s) => s.currentProjectId)
  const setCurrentProjectId = useBoardStore((s) => s.setCurrentProjectId)
  const deleteProject = useDeleteProject()
  const toast = useToast()

  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | undefined>()

  // Auto-select first project on load
  React.useEffect(() => {
    if (!currentProjectId && projects.length > 0) {
      setCurrentProjectId(projects[0].id)
    }
  }, [projects, currentProjectId, setCurrentProjectId])

  function openCreate() {
    setEditingProject(undefined)
    setModalOpen(true)
  }

  function openEdit(e: React.MouseEvent, project: Project) {
    e.stopPropagation()
    setEditingProject(project)
    setModalOpen(true)
  }

  async function handleDelete(e: React.MouseEvent, project: Project) {
    e.stopPropagation()
    const confirmed = window.confirm(
      `Delete "${project.name}"?\n\nThis will permanently delete all tasks and sprints in this project.`,
    )
    if (!confirmed) return

    try {
      await deleteProject.mutateAsync(project.id)
      if (currentProjectId === project.id) setCurrentProjectId(null)
      toast({ title: `"${project.name}" deleted` })
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Delete failed', variant: 'error' })
    }
  }

  return (
    <>
      <aside className="flex h-full w-56 flex-col border-r border-slate-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Projects</span>
          <button
            onClick={openCreate}
            title="New project"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Project list */}
        <nav className="flex-1 overflow-y-auto py-2">
          {isLoading && (
            <p className="px-4 py-2 text-sm text-slate-400">Loading…</p>
          )}
          {isError && (
            <p className="px-4 py-2 text-sm text-red-500">Failed to load projects</p>
          )}
          {!isLoading && !isError && projects.length === 0 && (
            <p className="px-4 py-2 text-sm text-slate-400">No projects yet</p>
          )}
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => setCurrentProjectId(project.id)}
              className={cn(
                'group flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors',
                currentProjectId === project.id
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <FolderKanban className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="flex-1 truncate">{project.name}</span>

              {/* Actions — visible on hover */}
              <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => openEdit(e, project)}
                  title="Rename"
                  className="rounded p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, project)}
                  title="Delete"
                  className="rounded p-0.5 hover:bg-red-100 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            </div>
          ))}
        </nav>

        {/* Footer CTA */}
        <div className="border-t border-slate-100 p-3">
          <Button variant="outline" size="sm" className="w-full" onClick={openCreate}>
            <Plus className="mr-1 h-3 w-3" /> New Project
          </Button>
        </div>
      </aside>

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        project={editingProject}
      />
    </>
  )
}
