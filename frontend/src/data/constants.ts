// Column definitions
export const COLUMNS = ['Backlog', 'InProgress', 'InReview', 'Done'] as const
export type Column = (typeof COLUMNS)[number]

export const COLUMN_LABELS: Record<Column, string> = {
  Backlog: 'Backlog',
  InProgress: 'In Progress',
  InReview: 'In Review',
  Done: 'Done',
}

export const COLUMN_STYLES: Record<
  Column,
  {
    headerBg: string
    headerText: string
    dot: string
    badgeBg: string
    badgeText: string
    cardBorder: string
    dropOver: string
  }
> = {
  Backlog: {
    headerBg: 'bg-slate-100',
    headerText: 'text-slate-700',
    dot: 'bg-slate-400',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    cardBorder: 'border-l-slate-300',
    dropOver: 'bg-slate-100/80 ring-2 ring-slate-300',
  },
  InProgress: {
    headerBg: 'bg-blue-50',
    headerText: 'text-blue-700',
    dot: 'bg-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    cardBorder: 'border-l-blue-400',
    dropOver: 'bg-blue-50/80 ring-2 ring-blue-200',
  },
  InReview: {
    headerBg: 'bg-amber-50',
    headerText: 'text-amber-700',
    dot: 'bg-amber-500',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    cardBorder: 'border-l-amber-400',
    dropOver: 'bg-amber-50/80 ring-2 ring-amber-200',
  },
  Done: {
    headerBg: 'bg-emerald-50',
    headerText: 'text-emerald-700',
    dot: 'bg-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    cardBorder: 'border-l-emerald-400',
    dropOver: 'bg-emerald-50/80 ring-2 ring-emerald-200',
  },
}

// Priority
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type Priority = (typeof PRIORITIES)[number]

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
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
