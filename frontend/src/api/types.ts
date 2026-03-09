// ── Domain types (mirror backend DTOs) ────────────────────────────────────────

export interface Project {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface Sprint {
  id: string
  projectId: string
  name: string
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskType = 'feature' | 'bug' | 'chore' | 'spike'
export type Column = 'Backlog' | 'InProgress' | 'InReview' | 'Done'

export interface Task {
  id: string
  projectId: string
  sprintId: string | null
  title: string
  priority: Priority
  type: TaskType
  assignee: string | null
  column: Column
  position: number
  githubPrUrl: string | null
  githubIssueUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Settings {
  id: string
  defaultProjectId: string | null
  telegramChatId: string | null
  digestTime: string
  githubWebhookSecret: string | null
}

// ── Request types ──────────────────────────────────────────────────────────────

export interface CreateProjectRequest {
  name: string
  description?: string | null
}

export interface UpdateProjectRequest {
  name: string
  description?: string | null
}

export interface CreateTaskRequest {
  projectId: string
  sprintId?: string | null
  title: string
  priority?: Priority
  type?: TaskType
  assignee?: string | null
  column?: Column
  githubPrUrl?: string | null
  githubIssueUrl?: string | null
}

export interface UpdateTaskRequest {
  sprintId?: string | null
  title: string
  priority: Priority
  type: TaskType
  assignee?: string | null
  column: Column
  githubPrUrl?: string | null
  githubIssueUrl?: string | null
}

export interface MoveTaskRequest {
  column: Column
  position?: number
}

export interface CreateSprintRequest {
  name: string
  startDate?: string | null
  endDate?: string | null
}

export interface UpdateSprintRequest {
  name: string
  startDate?: string | null
  endDate?: string | null
}

export interface UpdateSettingsRequest {
  defaultProjectId?: string | null
  telegramChatId?: string | null
  digestTime: string
  githubWebhookSecret?: string | null
}
