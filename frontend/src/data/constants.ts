// Column definitions
export const COLUMNS = ['Backlog', 'InProgress', 'InReview', 'Done'] as const
export type Column = (typeof COLUMNS)[number]

export const COLUMN_LABELS: Record<Column, string> = {
  Backlog: 'Backlog',
  InProgress: 'In Progress',
  InReview: 'In Review',
  Done: 'Done',
}

// Priority
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type Priority = (typeof PRIORITIES)[number]

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

// Task types
export const TASK_TYPES = ['feature', 'bug', 'chore', 'spike'] as const
export type TaskType = (typeof TASK_TYPES)[number]

export const TYPE_COLORS: Record<TaskType, string> = {
  feature: 'bg-purple-100 text-purple-700',
  bug: 'bg-red-100 text-red-700',
  chore: 'bg-gray-100 text-gray-600',
  spike: 'bg-yellow-100 text-yellow-700',
}

// API base URL — overridable via environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'
