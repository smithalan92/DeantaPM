import { useApp } from '../context/AppContext'
import type { Task } from '../types'
import { PRIORITY_LABELS, STATUS_LABELS } from '../types'

function isOverdue(task: Task) {
  return task.dueDate && task.status !== 'done' && task.dueDate < new Date().toISOString().slice(0, 10)
}

export default function Dashboard() {
  const { state, dispatch } = useApp()
  const { tasks, projects } = state

  const totalTasks = tasks.length
  const todo = tasks.filter((t) => t.status === 'todo').length
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length
  const done = tasks.filter((t) => t.status === 'done').length
  const overdue = tasks.filter(isOverdue).length

  const upcomingTasks = tasks
    .filter((t) => t.status !== 'done' && t.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, 8)

  const today = new Date().toISOString().slice(0, 10)

  function getProjectColor(projectId: string) {
    return projects.find((p) => p.id === projectId)?.color ?? '#64748b'
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  function priorityClass(priority: Task['priority']) {
    return {
      high: 'text-red-400 bg-red-500/10',
      medium: 'text-amber-400 bg-amber-500/10',
      low: 'text-slate-400 bg-slate-500/10',
    }[priority]
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6 gap-6">
      <h2 className="text-lg font-semibold text-slate-200">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: totalTasks, color: 'text-slate-200' },
          { label: STATUS_LABELS['todo'], value: todo, color: 'text-slate-400' },
          { label: STATUS_LABELS['in-progress'], value: inProgress, color: 'text-indigo-400' },
          { label: STATUS_LABELS['done'], value: done, color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border-edge rounded-xl border p-4">
            <p className="text-[13px] text-slate-500">{stat.label}</p>
            <p className={`mt-1 text-3xl font-semibold tabular-nums ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {overdue > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {overdue} task{overdue > 1 ? 's are' : ' is'} overdue
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Upcoming tasks */}
        <div className="bg-surface border-edge rounded-xl border flex flex-col">
          <p className="text-sm font-medium text-slate-300 px-4 pt-4 pb-3 border-b border-[var(--color-edge)]">Upcoming</p>
          {upcomingTasks.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 text-center">No upcoming tasks</p>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-[var(--color-edge)]">
              {upcomingTasks.map((task) => {
                const overdueTask = task.dueDate! < today
                return (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors duration-100"
                    onClick={() => dispatch({ type: 'SET_SELECTED_PROJECT', id: task.projectId })}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: getProjectColor(task.projectId) }}
                    />
                    <span className="flex-1 text-sm text-slate-200 truncate">{task.title}</span>
                    <span className={`text-xs shrink-0 ${overdueTask ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                      {formatDate(task.dueDate!)}
                    </span>
                    <span className={`text-xs shrink-0 rounded px-1.5 py-0.5 ${priorityClass(task.priority)}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Projects summary */}
        <div className="bg-surface border-edge rounded-xl border flex flex-col">
          <p className="text-sm font-medium text-slate-300 px-4 pt-4 pb-3 border-b border-[var(--color-edge)]">Projects</p>
          {projects.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 text-center">No projects yet</p>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-[var(--color-edge)]">
              {projects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id)
                const projectDone = projectTasks.filter((t) => t.status === 'done').length
                const progress = projectTasks.length > 0 ? (projectDone / projectTasks.length) * 100 : 0
                return (
                  <li
                    key={project.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors duration-100"
                    onClick={() => dispatch({ type: 'SET_SELECTED_PROJECT', id: project.id })}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: project.color }}
                    />
                    <span className="flex-1 text-sm text-slate-200 truncate">{project.name}</span>
                    <span className="text-xs text-slate-500 shrink-0">{projectDone}/{projectTasks.length}</span>
                    <div className="w-16 h-1.5 rounded-full bg-white/10 shrink-0 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%`, background: project.color }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
