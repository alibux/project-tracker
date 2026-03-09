import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks'
import type { CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest } from '../api/types'

export const TASK_KEYS = {
  all: (projectId: string) => ['tasks', projectId] as const,
  filtered: (projectId: string, sprintId?: string | null) =>
    ['tasks', projectId, sprintId ?? 'all'] as const,
}

export function useTasks(projectId: string | null, sprintId?: string | null) {
  return useQuery({
    queryKey: TASK_KEYS.filtered(projectId ?? '', sprintId),
    queryFn: () =>
      tasksApi.list({
        projectId: projectId!,
        ...(sprintId ? { sprintId } : {}),
      }),
    enabled: Boolean(projectId),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskRequest) => tasksApi.create(data),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: TASK_KEYS.all(vars.projectId) }),
  })
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      tasksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) }),
  })
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) }),
  })
}

export function useMoveTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveTaskRequest }) =>
      tasksApi.move(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) }),
  })
}
