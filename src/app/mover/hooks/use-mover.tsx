import {z} from 'zod'
import {invoke} from '@tauri-apps/api/core'
import {createContext, useContext, useMemo, useState} from 'react'
import {useForm, UseFormReturn} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {MoverProgress} from "@/app/mover/components/mover-form.tsx";

const formSchema = z.object({
  folder: z.string().min(1, {
    message: 'You need to choose a folder.'
  }),
  target: z.string().min(1, {
    message: 'You need to choose a target folder.'
  }),
  serum_noises: z.boolean().default(false),
  move_project_files: z.boolean().default(false),
  move_samples: z.boolean().default(false), // Default to false, cause we only want to copy if not specified to actually move the files
  create_backup: z.boolean().default(false),
  exclude_files: z.array(z.string()).optional().default([])
})

type MoverContextType = {
  progress: MoverProgress | undefined
  isRunning: boolean
  isProjectsLoading: boolean
  isMoving: boolean
  files: string[]
  error: string | undefined
  form: UseFormReturn<z.infer<typeof formSchema>>
  mover: (values: z.infer<typeof formSchema>) => Promise<void>
  updateProgress: (p: MoverProgress) => void
  getProjectFiles: (directory: string) => Promise<void>
  restart: () => void
}

const MoverContext = createContext<MoverContextType | undefined>(undefined)

export const useMover = () => {
  const context = useContext(MoverContext)
  if (!context) {
    throw new Error('useMover must be used within a MoverProvider')
  }
  return context
}

interface MoverProviderProps {
  children: React.ReactNode
}

export const MoverProvider = ({children}: MoverProviderProps) => {
  const [progress, setProgress] = useState<MoverProgress | undefined>()
  const [isMoving, setIsMoving] = useState<boolean>(false)
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false)
  const [files, setFiles] = useState<string[]>([])
  const [error, setError] = useState<string | undefined>(undefined)
  const isRunning = progress !== 100

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  })

  const { reset } = form

  const mover = async (values: z.infer<typeof formSchema>) => {
    setProgress(undefined)
    setIsMoving(true)
    setError(undefined)
    try {
      await invoke('mover', { settings: values })
    } catch (e: any) {
      setError(e)
      console.error(e)
    }
  }

  const restart = () => {
    reset()
    setFiles([])
    setIsMoving(false)
    setError(undefined)
    setProgress(undefined)
  }

  const updateProgress = (p: MoverProgress) => {
    setProgress(p)
  }

  const getProjectFiles = async (directory: string) => {
    setIsProjectsLoading(true)
    try {
      setFiles([])
      const alsFiles = ((await invoke('get_als_files', {folder: directory})) as string[]) ?? []
      setFiles(alsFiles)
    } catch (e: any) {
      setError(e)
      console.log(e)
    } finally {
      setIsProjectsLoading(false)
    }
  }

  const value = useMemo(
    () => ({
      progress,
      isMoving,
      isProjectsLoading,
      files,
      error,
      isRunning,
      mover,
      updateProgress,
      getProjectFiles,
      form,
      restart
    }),
    [progress, files, isMoving, isProjectsLoading]
  )

  return <MoverContext.Provider value={value}>{children}</MoverContext.Provider>
}
