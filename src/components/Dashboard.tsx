import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pin } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { Task } from '../types'
import { INBOX_PROJECT_ID, PRIORITY_LABELS, STATUS_LABELS } from '../types'

function isOverdue(task: Task) {
  return task.dueDate && task.status !== 'done' && task.dueDate < new Date().toISOString().slice(0, 10)
}

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }

function sortNeedsDoing(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    // Pinned always float to top
    if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
    // Manual order takes precedence over priority
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder
    // For tasks with no order yet, fall back to priority then recency
    const aPriority = PRIORITY_RANK[a.priority ?? ''] ?? 3
    const bPriority = PRIORITY_RANK[b.priority ?? ''] ?? 3
    if (aPriority !== bPriority) return aPriority - bPriority
    return b.createdAt.localeCompare(a.createdAt)
  })
}

interface NeedsDoingRowProps {
  task: Task
  projectColor: string
  projectName: string
  onNavigate: () => void
  onPin: () => void
}

function NeedsDoingRow({ task, projectColor, projectName, onNavigate, onPin }: NeedsDoingRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const priorityClass = ({
    high: 'text-red-400 bg-red-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    low: 'text-slate-400 bg-slate-500/10',
  } as Record<string, string>)[task.priority ?? ''] ?? ''

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.03] transition-colors duration-100"
    >
      <button
        className="shrink-0 cursor-grab text-slate-600 hover:text-slate-400 touch-none"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: projectColor }} />
      <button
        className="flex-1 overflow-hidden text-left text-sm text-slate-200 text-ellipsis whitespace-nowrap cursor-pointer border-none bg-transparent hover:text-indigo-400 transition-colors duration-100"
        onClick={onNavigate}
        title={`${projectName} · ${task.title}`}
      >
        {task.title}
      </button>
      {task.priority && (
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${priorityClass}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      )}
      <button
        className={`shrink-0 cursor-pointer rounded border-none bg-transparent p-1 transition-all duration-[0.12s] hover:bg-white/[0.07] ${task.pinned ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
        onClick={onPin}
        title={task.pinned ? 'Unpin' : 'Pin to top'}
      >
        <Pin size={12} />
      </button>
      {task.dueDate && (
        <span className={`shrink-0 text-xs ${isOverdue(task) ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
          {new Date(task.dueDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      )}
    </li>
  )
}

function DragPreview({ task, projectColor }: { task: Task; projectColor: string }) {
  const priorityClass = ({
    high: 'text-red-400 bg-red-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    low: 'text-slate-400 bg-slate-500/10',
  } as Record<string, string>)[task.priority ?? ''] ?? ''

  return (
    <div className="bg-surface border-edge flex items-center gap-3 rounded-lg border px-3 py-2.5 shadow-xl">
      <GripVertical size={14} className="text-slate-500" />
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: projectColor }} />
      <span className="flex-1 text-sm text-slate-200 truncate">{task.title}</span>
      {task.priority && (
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${priorityClass}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { state, dispatch } = useApp()
  const { tasks, projects } = state
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const totalTasks = tasks.length
  const todo = tasks.filter((t) => t.status === 'todo').length
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length
  const done = tasks.filter((t) => t.status === 'done').length
  const overdue = tasks.filter(isOverdue).length

  const needsDoing = sortNeedsDoing(tasks.filter((t) => t.status !== 'done'))

  const upcomingTasks = tasks
    .filter((t) => t.status !== 'done' && t.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, 8)

  const today = new Date().toISOString().slice(0, 10)

  const userProjects = projects.filter((p) => p.id !== INBOX_PROJECT_ID)

  function getProject(projectId: string) {
    return projects.find((p) => p.id === projectId)
  }

  function getProjectColor(projectId: string) {
    return getProject(projectId)?.color ?? '#64748b'
  }

  function getProjectName(projectId: string) {
    return getProject(projectId)?.name ?? 'Inbox'
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  function priorityClass(priority: Task['priority']) {
    return (
      ({
        high: 'text-red-400 bg-red-500/10',
        medium: 'text-amber-400 bg-amber-500/10',
        low: 'text-slate-400 bg-slate-500/10',
      } as Record<string, string>)[priority ?? ''] ?? ''
    )
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = needsDoing.map((t) => t.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    dispatch({ type: 'REORDER_TASKS', orderedIds: arrayMove(ids, oldIndex, newIndex) })
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

      {/* Needs Doing */}
      <div className="bg-surface border-edge rounded-xl border flex flex-col min-h-0">
        <p className="text-sm font-medium text-slate-300 px-4 pt-4 pb-3 border-b border-[var(--color-edge)] shrink-0">
          Needs Doing
          {needsDoing.length > 0 && (
            <span className="ml-2 text-xs text-slate-500 font-normal">{needsDoing.length} open</span>
          )}
        </p>
        {needsDoing.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500 text-center">All caught up!</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={needsDoing.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-[var(--color-edge)] overflow-y-auto max-h-72">
                {needsDoing.map((task) => (
                  <NeedsDoingRow
                    key={task.id}
                    task={task}
                    projectColor={getProjectColor(task.projectId)}
                    projectName={getProjectName(task.projectId)}
                    onNavigate={() => dispatch({ type: 'SET_SELECTED_PROJECT', id: task.projectId })}
                    onPin={() =>
                      dispatch({ type: 'PIN_TASK', id: task.id, pinned: !task.pinned })
                    }
                  />
                ))}
              </ul>
            </SortableContext>
            <DragOverlay>
              {activeTask && (
                <DragPreview
                  task={activeTask}
                  projectColor={getProjectColor(activeTask.projectId)}
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

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
                    {task.priority && (
                      <span className={`text-xs shrink-0 rounded px-1.5 py-0.5 ${priorityClass(task.priority)}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Projects summary */}
        <div className="bg-surface border-edge rounded-xl border flex flex-col">
          <p className="text-sm font-medium text-slate-300 px-4 pt-4 pb-3 border-b border-[var(--color-edge)]">Projects</p>
          {userProjects.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 text-center">No projects yet</p>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-[var(--color-edge)]">
              {userProjects.map((project) => {
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
