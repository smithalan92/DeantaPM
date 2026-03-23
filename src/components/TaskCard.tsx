import React, { useState } from 'react'
import { Trash2, Calendar } from 'lucide-react'
import { confirm } from '@tauri-apps/plugin-dialog'
import type { Task } from '../types'
import { PRIORITY_LABELS, STATUS_LABELS } from '../types'
import { useApp } from '../context/AppContext'
import TaskModal from './TaskModal'
import TruncatedTooltip from './TruncatedTooltip'

interface Props {
  task: Task
  showStatus?: boolean
}

const PRIORITY_BORDER: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-400',
  low: 'border-l-green-500',
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-red-950 text-red-500',
  medium: 'bg-amber-950 text-amber-400',
  low: 'bg-green-950 text-green-500',
}

export default function TaskCard({ task, showStatus = false }: Props) {
  const { dispatch } = useApp()
  const [editing, setEditing] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (
      await confirm('Are you sure you want to delete this task?', {
        title: 'Delete Task',
        kind: 'warning',
      })
    ) {
      dispatch({ type: 'DELETE_TASK', id: task.id })
    }
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <>
      <div
        className={`group bg-surface-2 cursor-pointer rounded-lg border-l-[3px] p-3 transition-colors duration-150 hover:bg-[#2a2f45] ${PRIORITY_BORDER[task.priority]}`}
        onClick={() => setEditing(true)}
      >
        <div className="flex items-start justify-between gap-2">
          <TruncatedTooltip label={task.title}>
            <span className="flex-1 overflow-hidden text-sm leading-[1.4] font-medium text-ellipsis whitespace-nowrap select-text">
              {task.title}
            </span>
          </TruncatedTooltip>
          <button
            className="shrink-0 cursor-pointer rounded border-none bg-transparent px-1.5 py-0.5 text-slate-500 opacity-0 transition-all duration-[0.12s] group-hover:opacity-100 hover:bg-red-500/15 hover:text-red-500"
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
        {task.description && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.4] text-slate-500 select-text">
            {task.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_BADGE[task.priority]}`}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
          {showStatus && (
            <span className="bg-surface-2 rounded-full px-2 py-0.5 text-xs font-semibold text-slate-500">
              {STATUS_LABELS[task.status]}
            </span>
          )}
          {task.dueDate && (
            <span
              className={`ml-auto flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}
            >
              <Calendar size={11} />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      {editing && <TaskModal task={task} onClose={() => setEditing(false)} />}
    </>
  )
}
