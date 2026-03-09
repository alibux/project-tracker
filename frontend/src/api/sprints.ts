import { apiFetch } from './client'
import type { Sprint, CreateSprintRequest, UpdateSprintRequest } from './types'

export const sprintsApi = {
  list: (projectId: string) =>
    apiFetch<Sprint[]>(`/api/projects/${projectId}/sprints`),

  create: (projectId: string, data: CreateSprintRequest) =>
    apiFetch<Sprint>(`/api/projects/${projectId}/sprints`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateSprintRequest) =>
    apiFetch<Sprint>(`/api/sprints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/sprints/${id}`, { method: 'DELETE' }),

  activate: (id: string) =>
    apiFetch<Sprint>(`/api/sprints/${id}/activate`, { method: 'POST' }),
}
