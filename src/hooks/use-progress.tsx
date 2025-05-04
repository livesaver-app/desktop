import { FieldValues, useForm, UseFormReturn } from 'react-hook-form'
import { createContext, useState } from 'react'
import { ZodSchema } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { invoke } from '@tauri-apps/api/core'

export interface IProgress {
  progress: number
  file_name: string
  is_error: boolean
  is_skipped: boolean
  error_message: string
}

type ProgressContextType<T extends FieldValues> = {
  log: IProgress[]
  progress: IProgress | undefined
  isRunning: boolean
  isProjectsLoading: boolean
  isProcessing: boolean
  files: string[]
  error: string | undefined
  form: UseFormReturn<T>
  process: (values: T) => Promise<void>
  updateProgress: (p: IProgress) => void
  getProjectFiles: (directory: string) => Promise<void>
  restart: () => void
}

export const createProgressContext = <T extends FieldValues>() =>
  createContext<ProgressContextType<T> | undefined>(undefined)

export const useProgress = <T extends FieldValues>(formSchema: ZodSchema<T>, command: string) => {
  const [log, setLog] = useState<IProgress[]>([])
  const [progress, setProgress] = useState<IProgress | undefined>(undefined)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false)
  const [files, setFiles] = useState<string[]>([])
  const [error, setError] = useState<string | undefined>(undefined)
  const isRunning = progress?.progress !== 100

  const form = useForm<T>({
    resolver: zodResolver(formSchema)
  })

  const { reset } = form

  const process = async (values: T) => {
    setProgress(undefined)
    setIsProcessing(true)
    setError(undefined)
    try {
      await invoke(command, { settings: values })
    } catch (e: any) {
      setError(e)
      console.error(e)
    } finally {
      //setIsProcessing(false)
    }
  }

  const restart = () => {
    reset()
    setLog([])
    setFiles([])
    setIsProcessing(false)
    setError(undefined)
    setProgress(undefined)
  }

  const updateProgress = (p: IProgress) => {
    setLog((prev) => [...prev, p])
    setProgress(p)
  }

  const getProjectFiles = async (directory: string) => {
    setIsProjectsLoading(true)
    try {
      setFiles([])
      const alsFiles = ((await invoke('get_als_files', { folder: directory })) as string[]) ?? []
      setFiles(alsFiles)
    } catch (e: any) {
      setError(e)
      console.log(e)
    } finally {
      setIsProjectsLoading(false)
    }
  }

  return {
    progress,
    log,
    isProcessing,
    isProjectsLoading,
    files,
    error,
    isRunning,
    process,
    updateProgress,
    getProjectFiles,
    form,
    restart
  }
}
