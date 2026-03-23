import { useApp } from '../context/AppContext'
import KanbanColumn from './KanbanColumn'
import type { TaskStatus } from '../types'

const COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done']

interface Props {
  projectId: string
}

export default function KanbanBoard({ projectId }: Props) {
  const { state } = useApp()
  const tasks = state.tasks.filter((t) => t.projectId === projectId)

  return (
    <div className="flex flex-1 items-start gap-4 overflow-x-auto px-6 py-5">
      {COLUMNS.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasks.filter((t) => t.status === status)}
          projectId={projectId}
        />
      ))}
    </div>
  )
}
