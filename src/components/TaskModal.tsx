import { useActionState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Task, TaskStatus, TaskPriority } from '../types'
import { STATUS_LABELS, PRIORITY_LABELS } from '../types'

interface Props {
  task?: Task | null
  defaultStatus?: TaskStatus
  defaultProjectId?: string
  onClose: () => void
}

export default function TaskModal({
  task,
  defaultStatus = 'todo',
  defaultProjectId,
  onClose,
}: Props) {
  const { state, dispatch } = useApp()
  const defaultProjectId_ = task?.projectId ?? defaultProjectId ?? state.projects[0]?.id ?? ''

  async function submitAction(_: null, formData: FormData) {
    const title = (formData.get('title') as string).trim()
    const description = (formData.get('description') as string).trim()
    const status = formData.get('status') as TaskStatus
    const priority = formData.get('priority') as TaskPriority
    const dueDate = formData.get('dueDate') as string
    const projectId = formData.get('projectId') as string
    if (!title || !projectId) return null
    const now = new Date().toISOString()
    if (task) {
      dispatch({
        type: 'UPDATE_TASK',
        task: {
          ...task,
          title,
          description: description || undefined,
          status,
          priority,
          dueDate: dueDate || undefined,
          projectId,
          updatedAt: now,
        },
      })
    } else {
      dispatch({
        type: 'ADD_TASK',
        task: {
          id: crypto.randomUUID(),
          projectId,
          title,
          description: description || undefined,
          status,
          priority,
          dueDate: dueDate || undefined,
          createdAt: now,
          updatedAt: now,
        },
      })
    }
    onClose()
    return null
  }

  const [, formAction, isPending] = useActionState(submitAction, null)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 pt-20"
      onClick={onClose}
    >
      <div
        className="animate-sheet-drop max-h-[85vh] w-[460px] max-w-[95vw] overflow-y-auto rounded-xl border border-white/10 bg-[rgba(30,30,32,0.92)] shadow-[0_0_0_0.5px_rgba(255,255,255,0.06),0_4px_6px_rgba(0,0,0,0.3),0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-[40px] backdrop-saturate-[180%]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-center border-b border-white/[0.07] px-5 pt-[18px] pb-[14px]">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-white/90">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            className="absolute top-1/2 right-3.5 flex h-[22px] w-[22px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-white/[0.08] p-0 text-white/50 transition-all duration-[0.12s] hover:bg-white/15 hover:text-white/90"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>
        <form action={formAction}>
          <div className="flex flex-col gap-4 p-5">
            <label className="form-label">
              Title
              <input
                autoFocus
                type="text"
                name="title"
                defaultValue={task?.title}
                placeholder="Task title"
                required
                className="form-input"
              />
            </label>
            <label className="form-label">
              Description
              <textarea
                name="description"
                defaultValue={task?.description}
                placeholder="Optional description"
                rows={3}
                className="form-input h-auto resize-y py-[7px]"
              />
            </label>
            <div className="flex gap-3">
              <label className="form-label flex-1">
                Status
                <select
                  name="status"
                  defaultValue={task?.status ?? defaultStatus}
                  className="form-input"
                >
                  {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-label flex-1">
                Priority
                <select
                  name="priority"
                  defaultValue={task?.priority ?? 'medium'}
                  className="form-input"
                >
                  {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-3">
              <label className="form-label flex-1">
                Due Date
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={task?.dueDate ? task.dueDate.slice(0, 10) : ''}
                  className="form-input"
                />
              </label>
              <label className="form-label flex-1">
                Project
                <select
                  name="projectId"
                  defaultValue={defaultProjectId_}
                  required
                  className="form-input"
                >
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-white/[0.07] px-5 pt-[14px] pb-[18px]">
            <button
              type="button"
              className="cursor-pointer rounded-md border border-white/[0.12] bg-white/[0.08] px-3.5 py-1.5 text-sm font-medium text-white/85 transition-all duration-[0.12s] hover:bg-white/[0.12] active:scale-[0.98]"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-md border-none bg-indigo-500 px-3.5 py-1.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-[0.12s] hover:bg-indigo-400 active:scale-[0.98] disabled:cursor-default disabled:opacity-50"
              disabled={isPending}
            >
              {isPending ? 'Saving…' : task ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
