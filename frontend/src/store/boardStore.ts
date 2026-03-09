import { create } from 'zustand'
import type { Project, Sprint, Task, Column } from '../api/types'

interface BoardState {
  // Selected project
  currentProjectId: string | null
  setCurrentProjectId: (id: string | null) => void

  // Sprint filter — null means "all tasks", string means filter to that sprint
  currentSprintId: string | null
  setCurrentSprintId: (id: string | null) => void

  // Optimistic task state for drag-and-drop
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  moveTaskOptimistic: (taskId: string, column: Column, position: number) => void
  revertTask: (original: Task) => void

  // Projects cache
  projects: Project[]
  setProjects: (projects: Project[]) => void

  // Sprints cache (for current project)
  sprints: Sprint[]
  setSprints: (sprints: Sprint[]) => void
}

export const useBoardStore = create<BoardState>((set) => ({
  currentProjectId: null,
  setCurrentProjectId: (id) => set({ currentProjectId: id, currentSprintId: null }),

  currentSprintId: null,
  setCurrentSprintId: (id) => set({ currentSprintId: id }),

  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  moveTaskOptimistic: (taskId, column, position) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, column, position } : t,
      ),
    })),
  revertTask: (original) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === original.id ? original : t)),
    })),

  projects: [],
  setProjects: (projects) => set({ projects }),

  sprints: [],
  setSprints: (sprints) => set({ sprints }),
}))
