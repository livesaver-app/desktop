export function getFileNameFromPath(path: string): string {
  const parts = path.split(/[/\\]/) // handles both "/" and "\" (Windows)
  return parts[parts.length - 1]
}

export function getFolderPath(fullPath: string): string {
  return fullPath.substring(0, fullPath.lastIndexOf('/'))
}
