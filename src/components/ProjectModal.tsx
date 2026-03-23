import { useState, useActionState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Project } from '../types'
import { PROJECT_COLORS } from '../types'

interface Props {
  project?: Project | null
  onClose: () => void
}

export default function ProjectModal({ project, onClose }: Props) {
  const { dispatch } = useApp()
  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0])

  async function submitAction(_: null, formData: FormData) {
    const name = (formData.get('name') as string).trim()
    const description = (formData.get('description') as string).trim()
    const selectedColor = formData.get('color') as string
    if (!name) return null
    const now = new Date().toISOString()
    if (project) {
      dispatch({
        type: 'UPDATE_PROJECT',
        project: {
          ...project,
          name,
          description: description || undefined,
          color: selectedColor,
          updatedAt: now,
        },
      })
    } else {
      dispatch({
        type: 'ADD_PROJECT',
        project: {
          id: crypto.randomUUID(),
          name,
          description: description || undefined,
          color: selectedColor,
          view: 'list',
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
            {project ? 'Edit Project' : 'New Project'}
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
            <input type="hidden" name="color" value={color} />
            <label className="form-label">
              Name
              <input
                autoFocus
                type="text"
                name="name"
                defaultValue={project?.name}
                placeholder="Project name"
                required
                className="form-input"
              />
            </label>
            <label className="form-label">
              Description
              <textarea
                name="description"
                defaultValue={project?.description}
                placeholder="Optional description"
                rows={3}
                className="form-input h-auto resize-y py-[7px]"
              />
            </label>
            <label className="form-label">
              Color
              <div className="flex flex-wrap gap-2 pt-0.5">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-[26px] w-[26px] cursor-pointer rounded-full border-2 border-transparent transition-[transform,box-shadow] duration-[0.12s] hover:scale-110 ${color === c ? 'scale-110 ring-2 ring-white/80' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </label>
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
              {isPending ? 'Saving…' : project ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
