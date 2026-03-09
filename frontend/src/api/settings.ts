import { apiFetch } from './client'
import type { Settings, UpdateSettingsRequest } from './types'

export const settingsApi = {
  get: () =>
    apiFetch<Settings>('/api/settings'),

  update: (data: UpdateSettingsRequest) =>
    apiFetch<Settings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}
