export type ProjectView = 'kanban' | 'list'

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  view?: ProjectView
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  pinned?: boolean
  order?: number
  createdAt: string
  updatedAt: string
}

export const INBOX_PROJECT_ID = 'inbox'

export const INBOX_PROJECT: Project = {
  id: INBOX_PROJECT_ID,
  name: 'Inbox',
  color: '#64748b',
  view: 'list',
  createdAt: '2000-01-01T00:00:00.000Z',
  updatedAt: '2000-01-01T00:00:00.000Z',
}

export type TaskStatus = Task['status']
export type TaskPriority = 'low' | 'medium' | 'high'

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const PROJECT_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
]
