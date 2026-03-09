import { apiFetch } from './client'
import type { Task, CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest } from './types'

export const tasksApi = {
  list: (params?: { projectId?: string; sprintId?: string }) => {
    const qs = new URLSearchParams()
    if (params?.projectId) qs.set('projectId', params.projectId)
    if (params?.sprintId) qs.set('sprintId', params.sprintId)
    const query = qs.toString() ? `?${qs}` : ''
    return apiFetch<Task[]>(`/api/tasks${query}`)
  },

  get: (id: string) =>
    apiFetch<Task>(`/api/tasks/${id}`),

  create: (data: CreateTaskRequest) =>
    apiFetch<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateTaskRequest) =>
    apiFetch<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/tasks/${id}`, { method: 'DELETE' }),

  move: (id: string, data: MoveTaskRequest) =>
    apiFetch<Task>(`/api/tasks/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}
