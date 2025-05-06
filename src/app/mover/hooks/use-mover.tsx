import { z } from 'zod'
import { useContext } from 'react'
import { createProgressContext, useProgress } from '@/hooks/use-progress.tsx'

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

type FormSchemaType = z.infer<typeof formSchema>

const MoverContext = createProgressContext<FormSchemaType>()

export const MoverProvider = ({ children }: { children: React.ReactNode }) => {
  const values = useProgress(formSchema, 'mover')
  // @ts-ignore
  return <MoverContext.Provider value={values}>{children}</MoverContext.Provider>
}

export const useMover = () => {
  const context = useContext(MoverContext)
  if (!context) {
    throw new Error('useMover must be used within a MoverProvider')
  }
  return context
}
