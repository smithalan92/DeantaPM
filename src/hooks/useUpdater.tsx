import { ask } from '@tauri-apps/plugin-dialog'
import { openUrl } from '@tauri-apps/plugin-opener'
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

        const openRelease = await ask(
          `Version ${update.version} is available. Open the releases page to download it?`,
          { title: 'Update Available', kind: 'info', okLabel: 'Download', cancelLabel: 'Later' },
        )

        if (openRelease) {
          await openUrl('https://github.com/smithalan92/DeantaPM/releases/latest')
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
