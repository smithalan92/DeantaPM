import { ask } from '@tauri-apps/plugin-dialog'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { useEffect } from 'react'

const CHECK_INTERVAL = 1000 * 60 * 60 // 1 hour

export default function useUpdater() {
  useEffect(() => {
    let interval: number

    const checkUpdates = async () => {
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
    }

    interval = setInterval(async () => {
      checkUpdates()
    }, CHECK_INTERVAL)

    checkUpdates()

    return () => clearInterval(interval)
  }, [])
}
