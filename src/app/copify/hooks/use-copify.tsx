import { z } from 'zod'
import { invoke } from '@tauri-apps/api/core'
import { createContext, useContext, useMemo, useState } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const formSchema = z.object({
  folder: z.string().min(1, {
    message: 'You need to choose a folder.'
  }),
  serum_noises: z.boolean().default(true),
  move_samples: z.boolean().default(false), // Default to false, cause we only want to copy if not specified to actually move the files
  create_backup: z.boolean().default(true),
  exclude_files: z.array(z.string()).optional().default([])
})

type CopifyContextType = {
  progress: number
  isRunning: boolean
  isProjectsLoading: boolean
  isCopifying: boolean
  files: string[]
  error: string | undefined
  form: UseFormReturn<z.infer<typeof formSchema>>
  copify: (values: z.infer<typeof formSchema>) => Promise<void>
  updateProgress: (p: number) => void
  getProjectFiles: (directory: string) => Promise<void>
  restart: () => void
}

const CopifyContext = createContext<CopifyContextType | undefined>(undefined)

export const useCopify = () => {
  const context = useContext(CopifyContext)
  if (!context) {
    throw new Error('useCopify must be used within a CopifyProvider')
  }
  return context
}

interface CopifyProviderProps {
  children: React.ReactNode
}

export const CopifyProvider = ({ children }: CopifyProviderProps) => {
  const [progress, setProgress] = useState<number>(0)
  const [isCopifying, setIsCopifying] = useState<boolean>(false)
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false)
  const [files, setFiles] = useState<string[]>([])
  const [error, setError] = useState<string | undefined>(undefined)
  const isRunning = progress !== 100

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  })

  const { reset } = form

  const copify = async (values: z.infer<typeof formSchema>) => {
    setProgress(0)
    setIsCopifying(true)
    setError(undefined)
    try {
      await invoke('copify', { settings: values })
    } catch (e: any) {
      setError(e)
      console.error(e)
    }
  }

  const restart = () => {
    reset()
    setFiles([])
    setIsCopifying(false)
    setError(undefined)
    setProgress(0)
  }

  const updateProgress = (p: number) => {
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

  const value = useMemo(
    () => ({
      progress,
      isCopifying,
      isProjectsLoading,
      files,
      error,
      isRunning,
      copify,
      updateProgress,
      getProjectFiles,
      form,
      restart
    }),
    [progress, files, isCopifying, isProjectsLoading]
  )

  return <CopifyContext.Provider value={value}>{children}</CopifyContext.Provider>
}
