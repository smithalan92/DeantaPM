import * as Tooltip from '@radix-ui/react-tooltip'
import { LayoutDashboard, List } from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import { INBOX_PROJECT_ID } from './types'
import Sidebar from './components/Sidebar'
import KanbanBoard from './components/KanbanBoard'
import ListView from './components/ListView'
import Dashboard from './components/Dashboard'
import './App.css'

function MainArea() {
  const { state, dispatch } = useApp()

  const project = state.projects.find((p) => p.id === state.selectedProjectId)

  if (!project) {
    return (
      <main className="bg-bg flex flex-1 flex-col overflow-hidden">
        <Dashboard />
      </main>
    )
  }

  return (
    <main className="bg-bg flex flex-1 flex-col overflow-hidden">
      <div className="border-edge bg-surface flex shrink-0 items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-full"
            style={{ background: project.color }}
          />
          <h2 className="text-[17px] font-semibold">{project.name}</h2>
          {project.description && (
            <span className="text-sm text-slate-500 select-text">{project.description}</span>
          )}
        </div>
        {project.id !== INBOX_PROJECT_ID && (
          <div className="bg-surface-2 flex gap-0.5 rounded-lg p-0.5">
            <button
              className={`flex cursor-pointer items-center gap-1.5 rounded-md border-none px-3 py-[5px] text-sm transition-all duration-150 ${(project.view ?? 'list') === 'kanban' ? 'bg-indigo-500 text-white' : 'bg-transparent text-slate-500'}`}
              onClick={() =>
                dispatch({
                  type: 'UPDATE_PROJECT',
                  project: { ...project, view: 'kanban', updatedAt: new Date().toISOString() },
                })
              }
            >
              <LayoutDashboard size={14} /> Kanban
            </button>
            <button
              className={`flex cursor-pointer items-center gap-1.5 rounded-md border-none px-3 py-[5px] text-sm transition-all duration-150 ${(project.view ?? 'list') === 'list' ? 'bg-indigo-500 text-white' : 'bg-transparent text-slate-500'}`}
              onClick={() =>
                dispatch({
                  type: 'UPDATE_PROJECT',
                  project: { ...project, view: 'list', updatedAt: new Date().toISOString() },
                })
              }
            >
              <List size={14} /> List
            </button>
          </div>
        )}
      </div>
      {(project.view ?? 'list') === 'kanban' ? (
        <KanbanBoard projectId={project.id} />
      ) : (
        <ListView projectId={project.id} />
      )}
    </main>
  )
}

export default function App() {
  return (
    <Tooltip.Provider delayDuration={400} skipDelayDuration={100}>
      <AppProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <MainArea />
        </div>
      </AppProvider>
    </Tooltip.Provider>
  )
}
