import React, { createContext, use, useReducer, useEffect, useRef } from 'react'
import type { Project, Task } from '../types'
import { loadProjects, saveProjects, loadTasks, saveTasks } from '../utils/storage'

interface AppState {
  projects: Project[]
  tasks: Task[]
  selectedProjectId: string | null
  loaded: boolean
}

type Action =
  | { type: 'INIT'; projects: Project[]; tasks: Task[] }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; project: Project }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; task: Task }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'SET_SELECTED_PROJECT'; id: string | null }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT':
      return { ...state, projects: action.projects, tasks: action.tasks, loaded: true }
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.project] }
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.project.id ? action.project : p)),
      }
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.id),
        tasks: state.tasks.filter((t) => t.projectId !== action.id),
        selectedProjectId: state.selectedProjectId === action.id ? null : state.selectedProjectId,
      }
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.task.id ? action.task : t)),
      }
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }
    case 'SET_SELECTED_PROJECT':
      return { ...state, selectedProjectId: action.id }
    default:
      return state
  }
}

const initialState: AppState = {
  projects: [],
  tasks: [],
  selectedProjectId: null,
  loaded: false,
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const isFirstRender = useRef(true)

  useEffect(() => {
    Promise.all([loadProjects(), loadTasks()]).then(([projects, tasks]) => {
      dispatch({ type: 'INIT', projects, tasks })
    })
  }, [])

  useEffect(() => {
    if (!state.loaded) return
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    saveProjects(state.projects)
    saveTasks(state.tasks)
  }, [state.projects, state.tasks, state.loaded])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = use(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
