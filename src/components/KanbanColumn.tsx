import { useState } from 'react'
import { Plus, Circle, Timer, CheckCircle2 } from 'lucide-react'
import type { Task, TaskStatus } from '../types'
import { STATUS_LABELS } from '../types'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  todo: <Circle size={13} />,
  'in-progress': <Timer size={13} />,
  done: <CheckCircle2 size={13} />,
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: 'text-slate-500',
  'in-progress': 'text-amber-400',
  done: 'text-green-500',
}

interface Props {
  status: TaskStatus
  tasks: Task[]
  projectId: string
}

export default function KanbanColumn({ status, tasks, projectId }: Props) {
  const [addingTask, setAddingTask] = useState(false)

  return (
    <div className="bg-surface border-edge flex max-h-[calc(100vh-120px)] w-70 min-w-70 flex-col rounded-lg border">
      <div className="border-edge flex shrink-0 items-center gap-1.5 border-b px-3.5 py-3">
        <span className={`flex shrink-0 items-center ${STATUS_COLOR[status]}`}>
          {STATUS_ICONS[status]}
        </span>
        <span className={`flex-1 text-sm font-semibold ${STATUS_COLOR[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="bg-surface-2 rounded-full px-[7px] py-0.5 text-xs font-semibold text-slate-500">
          {tasks.length}
        </span>
        <button
          className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-slate-500 transition-all duration-[0.12s] hover:bg-white/[0.08] hover:text-slate-200"
          onClick={() => setAddingTask(true)}
          title="Add task"
        >
          <Plus size={15} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
      {addingTask && (
        <TaskModal
          defaultStatus={status}
          defaultProjectId={projectId}
          onClose={() => setAddingTask(false)}
        />
      )}
    </div>
  )
}
