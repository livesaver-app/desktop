import { zodResolver } from '@hookform/resolvers/zod'
import { Control, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button.tsx'
import { open } from '@tauri-apps/plugin-dialog'
import { open as openUrl } from '@tauri-apps/plugin-shell'
import { invoke } from '@tauri-apps/api/core'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form.tsx'
import { Input } from '@/components/ui/input.tsx'
import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { Progress } from '@/components/ui/progress.tsx'
import { Checkbox } from './ui/checkbox'
import useAuth from '@/hooks/use-auth.tsx'
import { appUrl } from '@/lib/constants.ts'
import { Switch } from './ui/switch'
import { AlertCircle } from 'lucide-react'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger
} from '@/components/ui/multi-select'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const CopifyForm = () => {
  const [progress, setProgress] = useState(0)
  const [isCopifying, setIsCopifying] = useState<boolean>()
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>()
  const [files, setFiles] = useState<string[]>()
  const { isPremium } = useAuth()
  const [error, setError] = useState<string | undefined>(undefined)
  const isRunning = progress !== 100

  useEffect(() => {
    const unlisten = listen('copify-progress', (event) => {
      setProgress(event.payload as number)
    })

    return () => {
      unlisten.then((f) => f())
    }
  }, [])

  const formSchema = z.object({
    folder: z.string().min(1, {
      message: 'You need to choose a folder.'
    }),
    serum_noises: z.boolean().default(true),
    move_samples: z.boolean().default(false), // Default to false, cause we only want to copy if not specified to actually move the files
    create_backup: z.boolean().default(true),
    exclude_files: z.array(z.string()).optional().default([])
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  })

  const { setValue } = form

  const chooseFolder = async () => {
    setError(undefined)
    try {
      const directory = await open({
        directory: isPremium,
        filters: [{ name: 'Ableton Live Project File', extensions: ['als'] }],
        multiple: false
      })
      if (!directory) return
      if (!isPremium) {
        setValue('folder', getFolderPath(directory))
      } else {
        setValue('folder', directory)
      }
      await getProjectFiles(directory)
    } catch (e: any) {
      setError(e)
      console.error(e)
    }
  }

  async function getProjectFiles(directory: string) {
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

  function getFileNameFromPath(path: string): string {
    const parts = path.split(/[/\\]/) // handles both "/" and "\" (Windows)
    return parts[parts.length - 1]
  }

  function getFolderPath(fullPath: string): string {
    return fullPath.substring(0, fullPath.lastIndexOf('/'))
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsCopifying(true)
    setError(undefined)
    try {
      await invoke('copify', { settings: values })
    } catch (e: any) {
      setError(e)
      console.error(e)
    }
  }

  return (
    <div className={'px-4 py-6  max-w-3xl mx-auto '}>
      <h1 className="py-2 scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl">
        Choose a folder to get started
      </h1>
      {!isPremium && (
        <div className={'text-sm italic pb-2 text-red-600'}>
          You are not subscribed! Go ahead and
          <Button onClick={async () => await openUrl(`${appUrl}/account`)} variant={'link'}>
            Upgrade
          </Button>{' '}
          to enabled the export options.
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        {isPremium ? (
          <>
            Copy project samples to project folder. Choose a folder to export multiple project at
            once. It is recommended to enable backups before starting a copify export.
          </>
        ) : (
          <>Copy project samples to project folder. Choose a project to get started.</>
        )}
      </p>
      {isCopifying ? (
        <>
          <p className={`pt-8 text-muted-foreground ${isRunning && 'animate-spin'}`}>
            {isRunning ? 'Copify in progress' : 'Copify finished'}
          </p>
          {progress > 0 && <Progress value={progress} className="w-full my-4" />}
          <div className="flex space-x-8">
            <Button className="my-4" onClick={() => setIsCopifying(false)}>
              Export another one!
            </Button>
          </div>
        </>
      ) : (
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="folder"
                render={({ field }) => (
                  <FormItem className="py-4">
                    <FormLabel>{isPremium ? <>Select folder</> : <>Select project</>}</FormLabel>
                    <FormControl>
                      <Input
                        onClick={chooseFolder}
                        type="text"
                        readOnly
                        placeholder="..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="exclude_files"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select projects to exclude</FormLabel>
                    <FormControl>
                      <MultiSelector
                        values={field.value ?? []}
                        onValuesChange={field.onChange}
                        loop
                      >
                        <MultiSelectorTrigger>
                          {isProjectsLoading ? (
                            <span className="text-xs italic flex animate-pulse text-muted-foreground">
                              <Loader2 className="animate-spin mx-2 h-4 w-6" />
                              Scanning for .als files
                            </span>
                          ) : (
                            <MultiSelectorInput
                              className="text-xs"
                              placeholder={`${isPremium ? 'Search projects...' : 'No projects to exclude'}`}
                            />
                          )}
                        </MultiSelectorTrigger>
                        {isPremium && (
                          <MultiSelectorContent>
                            <MultiSelectorList>
                              {files?.map((path) => (
                                <MultiSelectorItem value={getFileNameFromPath(path)}>
                                  {getFileNameFromPath(path)}
                                </MultiSelectorItem>
                              ))}
                            </MultiSelectorList>
                          </MultiSelectorContent>
                        )}
                      </MultiSelector>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <h2 className="pt-6 pb-2">Export settings</h2>
              <Checker
                disabled={!isPremium}
                isChecker={false}
                control={form.control}
                name="serum_noises"
                title="Copy Serum noises"
                desc="Copy Serum noises to the Samples folder"
              />
              <Checker
                disabled={!isPremium}
                isChecker={false}
                control={form.control}
                name="move_samples"
                title="Move sample files"
                desc="Move samples permanently (NOT RECOMMENDED)"
              />
              <Checker
                disabled={!isPremium}
                isChecker={false}
                control={form.control}
                name="create_backup"
                title="Backup"
                desc="Create a backup of my .als files"
              />
              <div className="space-x-4 py-2">
                <Button disabled={isProjectsLoading} type="submit" className="px-8">
                  Start
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}
      {!!error && <ErrorAlert message={error} />}
    </div>
  )
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant={'destructive'}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

const Checker = ({
  isChecker,
  control,
  name,
  title,
  desc,
  disabled
}: {
  disabled: boolean
  isChecker: boolean
  control: Control<any>
  name: string
  title: string
  desc: string
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={`${isChecker
              ? 'flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'
              : 'flex flex-row items-center justify-between rounded-lg border p-4'
            }`}
        >
          {isChecker && (
            <FormControl>
              <Checkbox
                checked={field.value}
                disabled={disabled}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          )}
          <div className={`${isChecker ? 'space-y-1 leading-none' : 'space-y-0.5'}`}>
            <FormLabel>{title}</FormLabel>
            <FormDescription>{desc}</FormDescription>
            <FormMessage />
          </div>
          {!isChecker && (
            <FormControl>
              <Switch
                checked={field.value}
                disabled={disabled}
                onCheckedChange={field.onChange}
                aria-readonly
              />
            </FormControl>
          )}
        </FormItem>
      )}
    />
  )
}
