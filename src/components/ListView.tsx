import { confirm } from '@tauri-apps/plugin-dialog'
import { Plus, Trash2 } from 'lucide-react'
import { useOptimistic, useRef, useState, useTransition } from 'react'
import { useApp } from '../context/AppContext'
import type { Task, TaskStatus } from '../types'
import { PRIORITY_LABELS, STATUS_LABELS } from '../types'
import TaskModal from './TaskModal'
import TruncatedTooltip from './TruncatedTooltip'

interface Props {
  projectId: string
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-red-950 text-red-500',
  medium: 'bg-amber-950 text-amber-400',
  low: 'bg-green-950 text-green-500',
}

export default function ListView({ projectId }: Props) {
  const { state, dispatch } = useApp()
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [quickAdd, setQuickAdd] = useState('')
  const [, startTransition] = useTransition()
  const quickAddRef = useRef<HTMLInputElement>(null)

  const tasks = state.tasks.filter((t) => t.projectId === projectId)

  const [optimisticTasks, applyOptimisticStatus] = useOptimistic(
    tasks,
    (current, { id, status }: { id: string; status: TaskStatus }) =>
      current.map((t) => (t.id === id ? { ...t, status } : t)),
  )

  function handleStatusChange(task: Task, status: TaskStatus) {
    startTransition(() => {
      applyOptimisticStatus({ id: task.id, status })
      dispatch({
        type: 'UPDATE_TASK',
        task: { ...task, status, updatedAt: new Date().toISOString() },
      })
    })
  }

  async function handleDelete(id: string) {
    if (
      await confirm('Are you sure you want to delete this task?', {
        title: 'Delete Task',
        kind: 'warning',
      })
    ) {
      dispatch({ type: 'DELETE_TASK', id })
    }
  }

  function handleQuickAdd(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setQuickAdd('')
      quickAddRef.current?.blur()
      return
    }
    if (e.key !== 'Enter') return
    const title = quickAdd.trim()
    if (!title) return
    const now = new Date().toISOString()
    dispatch({
      type: 'ADD_TASK',
      task: {
        id: crypto.randomUUID(),
        projectId,
        title,
        status: 'todo',
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
      },
    })
    setQuickAdd('')
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th className="table-th">Title</th>
            <th className="table-th w-[130px]">Status</th>
            <th className="table-th w-[100px]">Priority</th>
            <th className="table-th w-[150px]">Due Date</th>
            <th className="border-edge w-20 border-b"></th>
          </tr>
        </thead>
        <tbody>
          {optimisticTasks.map((task) => {
            const isOverdue =
              task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
            return (
              <tr key={task.id} className="group">
                <td className="table-td">
                  <TruncatedTooltip label={task.title}>
                    <button
                      className="block w-full cursor-pointer overflow-hidden border-none bg-transparent text-left text-sm font-medium text-ellipsis whitespace-nowrap text-slate-200 underline select-text hover:text-indigo-400"
                      onClick={() => setEditingTask(task)}
                    >
                      {task.title}
                    </button>
                  </TruncatedTooltip>
                </td>
                <td className="table-td">
                  <select
                    className="bg-surface-2 border-edge cursor-pointer rounded-md border px-2 py-1 text-[13px] text-slate-200"
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                  >
                    {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="table-td">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_BADGE[task.priority]}`}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </td>
                <td className="table-td">
                  <input
                    type="date"
                    className={`bg-surface-2 border-edge w-[130px] cursor-pointer rounded-md border px-2 py-1 text-[13px] text-slate-200 ${isOverdue ? 'date-overdue' : ''}`}
                    value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_TASK',
                        task: {
                          ...task,
                          dueDate: e.target.value || undefined,
                          updatedAt: new Date().toISOString(),
                        },
                      })
                    }
                  />
                </td>
                <td className="table-td w-10">
                  <div className="px-4">
                    <button
                      className="cursor-pointer rounded border-none bg-transparent p-2 text-slate-500 transition-all duration-[0.12s] hover:bg-red-500/15 hover:text-red-500"
                      onClick={() => handleDelete(task.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
          <tr>
            <td colSpan={5} className="border-edge border-b p-0">
              <div className="flex items-center gap-2 px-3 text-slate-500">
                <Plus size={14} />
                <input
                  ref={quickAddRef}
                  className="focus:bg-surface flex-1 border-none bg-transparent py-4 text-[13px] text-slate-200 outline-none placeholder:text-slate-500"
                  type="text"
                  placeholder="Add a task… (press Enter to save)"
                  value={quickAdd}
                  onChange={(e) => setQuickAdd(e.target.value)}
                  onKeyDown={handleQuickAdd}
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      {optimisticTasks.length === 0 && (
        <p className="px-2.5 py-3 text-center text-[13px] text-slate-500">
          No tasks yet — type below to add one.
        </p>
      )}
      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
    </div>
  )
}
