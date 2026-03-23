import { confirm } from '@tauri-apps/plugin-dialog'
import { FolderPlus, Pencil, Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { Project } from '../types'
import ProjectModal from './ProjectModal'
import TruncatedTooltip from './TruncatedTooltip'

export default function Sidebar() {
  const { state, dispatch } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  function handleEdit(e: React.MouseEvent, project: Project) {
    e.stopPropagation()
    setEditingProject(project)
    setShowModal(true)
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (
      await confirm('This will also delete all tasks in the project.', {
        title: 'Delete Project',
        kind: 'warning',
      })
    ) {
      dispatch({ type: 'DELETE_PROJECT', id })
    }
  }

  function handleCloseModal() {
    setShowModal(false)
    setEditingProject(null)
  }

  return (
    <aside className="bg-surface border-edge flex w-60 min-w-60 flex-col overflow-hidden border-r">
      <nav className="p-2 pt-3">
        <button
          className={`group flex w-full cursor-pointer items-center gap-2 rounded-lg border-none px-2.5 py-2 text-sm transition-colors duration-150 ${state.selectedProjectId === null ? 'bg-surface-2 text-slate-200' : 'hover:bg-surface-2 bg-transparent text-slate-500'}`}
          onClick={() => dispatch({ type: 'SET_SELECTED_PROJECT', id: null as unknown as string })}
        >
          <h1 className="text-base font-semibold text-slate-200">Dashboard</h1>
        </button>
      </nav>

      <div className="border-edge flex items-center justify-between border-t border-b px-4 pt-3 pb-2">
        <h1 className="text-base font-semibold text-slate-200">Projects</h1>
        <button
          className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-slate-500 transition-all duration-[0.12s] hover:bg-white/[0.08] hover:text-slate-200"
          onClick={() => setShowModal(true)}
          title="New project"
        >
          <FolderPlus size={15} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {state.projects.length === 0 && (
          <p className="px-2.5 py-3 text-center text-[13px] text-slate-500">No projects yet</p>
        )}
        {state.projects.map((project) => (
          <div
            key={project.id}
            className={`group hover:bg-surface-2 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors duration-150 ${state.selectedProjectId === project.id ? 'bg-surface-2' : ''}`}
            onClick={() => dispatch({ type: 'SET_SELECTED_PROJECT', id: project.id })}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: project.color }}
            />
            <TruncatedTooltip label={project.name}>
              <span className="flex-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                {project.name}
              </span>
            </TruncatedTooltip>
            <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100">
              <button
                className="cursor-pointer rounded border-none bg-transparent px-1.5 py-0.5 text-slate-500 transition-all duration-[0.12s] hover:bg-white/[0.07] hover:text-slate-200"
                onClick={(e) => handleEdit(e, project)}
                title="Edit"
              >
                <Pencil size={13} />
              </button>
              <button
                className="cursor-pointer rounded border-none bg-transparent px-1.5 py-0.5 text-slate-500 transition-all duration-[0.12s] hover:bg-red-500/15 hover:text-red-500"
                onClick={(e) => handleDelete(e, project.id)}
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </nav>

      {showModal && <ProjectModal project={editingProject} onClose={handleCloseModal} />}
    </aside>
  )
}
