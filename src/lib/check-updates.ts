import { check } from '@tauri-apps/plugin-updater'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { relaunch } from '@tauri-apps/plugin-process'

export async function checkForUpdates(onUserClick: false) {
  const update = await check()
  if (!update) {
    console.log('No update available')
  } else if (update) {
    console.log('Update available!', update.version, update.body)
    const yes = await ask(
      `Update to ${update.version} is available!\n\nRelease notes: ${update.body}`,
      {
        title: 'Update Available',
        kind: 'info',
        okLabel: 'Update',
        cancelLabel: 'Cancel'
      }
    )
    if (yes) {
      await update.downloadAndInstall()
      await relaunch()
    }
  } else if (onUserClick) {
    await message('You are on the latest version. Stay awesome!', {
      title: 'No Update Available',
      kind: 'info',
      okLabel: 'OK'
    })
  }
}
