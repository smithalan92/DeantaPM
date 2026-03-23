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
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { confirm } from '@tauri-apps/plugin-dialog'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { useOptimistic, useRef, useState, useTransition } from 'react'
import { useApp } from '../context/AppContext'
import type { Task, TaskPriority, TaskStatus } from '../types'
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

interface RowProps {
  task: Task
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: TaskStatus) => void
  onPriorityChange: (priority: string) => void
  onDateChange: (date: string) => void
}

function SortableRow({ task, onEdit, onDelete, onStatusChange, onPriorityChange, onDateChange }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <tr ref={setNodeRef} style={style} className="group">
      <td className="table-td w-8">
        <button
          className="cursor-grab text-slate-600 hover:text-slate-400 touch-none p-1"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      </td>
      <td className="table-td">
        <TruncatedTooltip label={task.title}>
          <button
            className="block w-full cursor-pointer overflow-hidden border-none bg-transparent text-left text-sm font-medium text-ellipsis whitespace-nowrap text-slate-200 underline select-text hover:text-indigo-400"
            onClick={onEdit}
          >
            {task.title}
          </button>
        </TruncatedTooltip>
      </td>
      <td className="table-td">
        <select
          className="bg-surface-2 border-edge cursor-pointer rounded-md border px-2 py-1 text-[13px] text-slate-200"
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
        >
          {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </td>
      <td className="table-td">
        <select
          className="bg-surface-2 border-edge cursor-pointer rounded-md border px-2 py-1 text-[13px] text-slate-200"
          value={task.priority ?? ''}
          onChange={(e) => onPriorityChange(e.target.value)}
        >
          <option value="">None</option>
          {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>
      </td>
      <td className="table-td">
        <input
          type="date"
          className={`bg-surface-2 border-edge w-[130px] cursor-pointer rounded-md border px-2 py-1 text-[13px] text-slate-200 ${isOverdue ? 'date-overdue' : ''}`}
          value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </td>
      <td className="table-td w-10">
        <div className="px-4">
          <button
            className="cursor-pointer rounded border-none bg-transparent p-2 text-slate-500 transition-all duration-[0.12s] hover:bg-red-500/15 hover:text-red-500"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function DragRowPreview({ task }: { task: Task }) {
  return (
    <div className="bg-surface border-edge flex items-center gap-3 rounded-lg border px-3 py-2.5 shadow-xl text-sm text-slate-200">
      <GripVertical size={14} className="text-slate-500" />
      <span className="flex-1 truncate">{task.title}</span>
      {task.priority && (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_BADGE[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      )}
    </div>
  )
}

export default function ListView({ projectId }: Props) {
  const { state, dispatch } = useApp()
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [quickAdd, setQuickAdd] = useState('')
  const [, startTransition] = useTransition()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const quickAddRef = useRef<HTMLInputElement>(null)

  const sortedTasks = [...state.tasks.filter((t) => t.projectId === projectId)].sort((a, b) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder
    return b.createdAt.localeCompare(a.createdAt)
  })

  const [optimisticTasks, applyOptimistic] = useOptimistic(
    sortedTasks,
    (
      current,
      update: { type: 'status'; id: string; status: TaskStatus } | { type: 'reorder'; ids: string[] },
    ) => {
      if (update.type === 'reorder') {
        const orderMap = new Map(update.ids.map((id, i) => [id, i]))
        return [...current].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
      }
      return current.map((t) => (t.id === update.id ? { ...t, status: update.status } : t))
    },
  )

  function handleStatusChange(task: Task, status: TaskStatus) {
    startTransition(() => {
      applyOptimistic({ type: 'status', id: task.id, status })
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

  function handlePriorityChange(task: Task, value: string) {
    dispatch({
      type: 'UPDATE_TASK',
      task: { ...task, priority: (value as TaskPriority) || undefined, updatedAt: new Date().toISOString() },
    })
  }

  function handleDateChange(task: Task, value: string) {
    dispatch({
      type: 'UPDATE_TASK',
      task: { ...task, dueDate: value || undefined, updatedAt: new Date().toISOString() },
    })
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
        createdAt: now,
        updatedAt: now,
      },
    })
    setQuickAdd('')
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragStart(event: DragStartEvent) {
    const task = optimisticTasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = optimisticTasks.map((t) => t.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...ids]
    reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, active.id as string)
    startTransition(() => {
      applyOptimistic({ type: 'reorder', ids: reordered })
      dispatch({ type: 'REORDER_TASKS', orderedIds: reordered })
    })
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className="border-edge w-8 border-b"></th>
              <th className="table-th">Title</th>
              <th className="table-th w-[130px]">Status</th>
              <th className="table-th w-[100px]">Priority</th>
              <th className="table-th w-[150px]">Due Date</th>
              <th className="border-edge w-20 border-b"></th>
            </tr>
          </thead>
          <SortableContext items={optimisticTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <tbody>
              {optimisticTasks.map((task) => (
                <SortableRow
                  key={task.id}
                  task={task}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleDelete(task.id)}
                  onStatusChange={(status) => handleStatusChange(task, status)}
                  onPriorityChange={(value) => handlePriorityChange(task, value)}
                  onDateChange={(value) => handleDateChange(task, value)}
                />
              ))}
              <tr>
                <td colSpan={6} className="border-edge border-b p-0">
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
          </SortableContext>
        </table>
        <DragOverlay>
          {activeTask && <DragRowPreview task={activeTask} />}
        </DragOverlay>
      </DndContext>
      {optimisticTasks.length === 0 && (
        <p className="px-2.5 py-3 text-center text-[13px] text-slate-500">
          No tasks yet — type below to add one.
        </p>
      )}
      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
    </div>
  )
}
