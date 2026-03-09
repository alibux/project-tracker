import { API_BASE_URL } from '../data/constants'

/**
 * Base fetch wrapper. Throws an Error with a meaningful message on non-2xx responses.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    // Try to parse RFC 7807 ProblemDetails
    let detail = `HTTP ${response.status}`
    try {
      const problem = await response.json()
      detail = problem.detail ?? problem.title ?? detail
    } catch {
      // ignore parse error — use status code message
    }
    throw new Error(detail)
  }

  // 204 No Content — return undefined cast to T
  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
