import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sprintsApi } from '../api/sprints'
import type { CreateSprintRequest, UpdateSprintRequest } from '../api/types'

export const SPRINT_KEYS = {
  all: (projectId: string) => ['sprints', projectId] as const,
}

export function useSprints(projectId: string | null) {
  return useQuery({
    queryKey: SPRINT_KEYS.all(projectId ?? ''),
    queryFn: () => sprintsApi.list(projectId!),
    enabled: Boolean(projectId),
  })
}

export function useCreateSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSprintRequest) => sprintsApi.create(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SPRINT_KEYS.all(projectId) }),
  })
}

export function useUpdateSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSprintRequest }) =>
      sprintsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SPRINT_KEYS.all(projectId) }),
  })
}

export function useDeleteSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sprintsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SPRINT_KEYS.all(projectId) }),
  })
}

export function useActivateSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sprintsApi.activate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SPRINT_KEYS.all(projectId) }),
  })
}
