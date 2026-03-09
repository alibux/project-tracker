import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiFetch } from '../api/client'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('apiFetch', () => {
  it('returns parsed JSON on 200', async () => {
    const mockData = { id: '1', name: 'Test' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    }))

    const result = await apiFetch('/api/projects')
    expect(result).toEqual(mockData)
  })

  it('returns undefined on 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => { throw new Error('no body') },
    }))

    const result = await apiFetch('/api/projects/1')
    expect(result).toBeUndefined()
  })

  it('throws with ProblemDetails detail on non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ title: 'Not Found', detail: 'Project not found', status: 404 }),
    }))

    await expect(apiFetch('/api/projects/bad-id')).rejects.toThrow('Project not found')
  })

  it('throws with HTTP status when no ProblemDetails body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => { throw new Error('bad json') },
    }))

    await expect(apiFetch('/api/projects')).rejects.toThrow('HTTP 500')
  })
})
