# Déanta

A local-first desktop project management app built with Tauri, React, and TypeScript.

"Déanta" is Irish for "complete" or "done".

## Features

- **Projects** — colour-coded projects with optional descriptions
- **Inbox** — a built-in catch-all for tasks not tied to a specific project
- **Tasks** — title, description, status, optional priority, and due date
- **Kanban & List views** — switch per project; list view supports inline editing of status, priority, and due date
- **Dashboard** — stat overview, a "Needs Doing" section showing all open tasks across every project, and an upcoming (date-based) task list
- **Drag-to-reorder** — manually order tasks in the Needs Doing list and list view; order persists across sessions
- **Pin tasks** — pin tasks to float them to the top of Needs Doing

## Tech stack

- [Tauri v2](https://tauri.app/) — desktop shell (Rust)
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [@dnd-kit](https://dndkit.com/) — drag-and-drop
- [Radix UI](https://www.radix-ui.com/) — accessible primitives
- [Lucide React](https://lucide.dev/) — icons

Data is stored locally as JSON files in the app data directory — no cloud, no database.

## Development

```bash
npm install
npm run tauri dev     # launch desktop app with hot reload
npm run build         # type-check and build
npm run format        # format with Prettier
```

## Recommended IDE setup

[VS Code](https://code.visualstudio.com/) with the [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) and [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) extensions.
