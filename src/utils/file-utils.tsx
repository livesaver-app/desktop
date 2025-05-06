import { open } from '@tauri-apps/plugin-shell'
import { dirname } from '@tauri-apps/api/path'

export function getFileNameFromPath(path: string): string {
  const parts = path.split(/[/\\]/) // handles both "/" and "\" (Windows)
  return parts[parts.length - 1]
}

export function getFolderPath(fullPath: string): string {
  return fullPath.substring(0, fullPath.lastIndexOf('/'))
}

export async function openFolder(filePath: string) {
  const folder = await dirname(filePath)
  await open(folder)
}
