import { z } from 'zod'
import { createProgressContext, useProgress } from '@/hooks/use-progress.tsx'
import { useContext } from 'react'

const formSchema = z.object({
  folder: z.string().min(1, {
    message: 'You need to choose a folder.'
  }),
  serum_noises: z.boolean().default(false),
  move_samples: z.boolean().default(false), // Default to false, cause we only want to copy if not specified to actually move the files
  create_backup: z.boolean().default(false),
  exclude_files: z.array(z.string()).optional().default([])
})

type FormSchemaType = z.infer<typeof formSchema>

const CopifyContext = createProgressContext<FormSchemaType>()

export const CopifyProvider = ({ children }: { children: React.ReactNode }) => {
  const values = useProgress(formSchema, 'copify')
  // @ts-ignore
  return <CopifyContext.Provider value={values}>{children}</CopifyContext.Provider>
}

export const useCopify = () => {
  const context = useContext(CopifyContext)
  if (!context) {
    throw new Error('useCopify must be used within a CopifyProvider')
  }
  return context
}
