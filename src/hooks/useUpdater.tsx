import { ask } from '@tauri-apps/plugin-dialog'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { useEffect } from 'react'

export default function useUpdater() {
  useEffect(() => {
    let interval: number

    interval = setInterval(async () => {
      const update = await check()

      if (update) {
        clearInterval(interval)
        await update.download()

        const install = await ask(
          `Version ${update.version} has been downloaded. Restart now to apply the update?`,
          { title: 'Update Ready', kind: 'info', okLabel: 'Restart', cancelLabel: 'Later' },
        )

        if (install) {
          await update.install()
          await relaunch()
        }
      }
    })

    return () => clearInterval(interval)
  }, [])
}
