import { readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs'
import { appDataDir } from '@tauri-apps/api/path'
import type { Project, Task } from '../types'

async function getDataDir(): Promise<string> {
  const dir = await appDataDir()
  const dirExists = await exists(dir)
  if (!dirExists) {
    await mkdir(dir, { recursive: true })
  }
  return dir
}

async function readJson<T>(filename: string, fallback: T): Promise<T> {
  try {
    const dir = await getDataDir()
    const path = `${dir}/${filename}`
    const fileExists = await exists(path)
    if (!fileExists) return fallback
    const text = await readTextFile(path)
    return JSON.parse(text) as T
  } catch {
    return fallback
  }
}

async function writeJson<T>(filename: string, data: T): Promise<void> {
  const dir = await getDataDir()
  await writeTextFile(`${dir}/${filename}`, JSON.stringify(data, null, 2))
}

export const loadProjects = (): Promise<Project[]> => readJson('projects.json', [])
export const saveProjects = (projects: Project[]): Promise<void> =>
  writeJson('projects.json', projects)
export const loadTasks = (): Promise<Task[]> => readJson('tasks.json', [])
export const saveTasks = (tasks: Task[]): Promise<void> => writeJson('tasks.json', tasks)
