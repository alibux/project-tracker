import { create } from 'zustand'
import type { Project, Sprint, Task } from '../api/types'

type PartialTask = Partial<Pick<Task, 'column' | 'position'>>

interface BoardState {
  // Selected project
  currentProjectId: string | null
  setCurrentProjectId: (id: string | null) => void

  // Sprint filter — null means "all tasks"
  currentSprintId: string | null
  setCurrentSprintId: (id: string | null) => void

  // Optimistic overrides keyed by task id (for drag-and-drop)
  optimisticTasks: Record<string, PartialTask>
  moveTaskOptimistic: (taskId: string, patch: PartialTask) => void
  revertTask: (taskId: string) => void
  clearOptimistic: () => void

  // Projects/sprints cache (populated by React Query hooks)
  projects: Project[]
  setProjects: (projects: Project[]) => void

  sprints: Sprint[]
  setSprints: (sprints: Sprint[]) => void
}

export const useBoardStore = create<BoardState>((set) => ({
  currentProjectId: null,
  setCurrentProjectId: (id) => set({ currentProjectId: id, currentSprintId: null }),

  currentSprintId: null,
  setCurrentSprintId: (id) => set({ currentSprintId: id }),

  optimisticTasks: {},
  moveTaskOptimistic: (taskId, patch) =>
    set((state) => ({
      optimisticTasks: { ...state.optimisticTasks, [taskId]: patch },
    })),
  revertTask: (taskId) =>
    set((state) => {
      const next = { ...state.optimisticTasks }
      delete next[taskId]
      return { optimisticTasks: next }
    }),
  clearOptimistic: () => set({ optimisticTasks: {} }),

  projects: [],
  setProjects: (projects) => set({ projects }),

  sprints: [],
  setSprints: (sprints) => set({ sprints }),
}))
