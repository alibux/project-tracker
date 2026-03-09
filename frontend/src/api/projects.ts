import { apiFetch } from './client'
import type { Project, CreateProjectRequest, UpdateProjectRequest } from './types'

export const projectsApi = {
  list: () =>
    apiFetch<Project[]>('/api/projects'),

  get: (id: string) =>
    apiFetch<Project>(`/api/projects/${id}`),

  create: (data: CreateProjectRequest) =>
    apiFetch<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateProjectRequest) =>
    apiFetch<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/projects/${id}`, { method: 'DELETE' }),
}
