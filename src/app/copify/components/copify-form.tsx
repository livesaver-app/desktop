import { Button } from '@/components/ui/button.tsx'
import { open } from '@tauri-apps/plugin-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form.tsx'
import { Input } from '@/components/ui/input.tsx'
import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { Progress } from '@/components/ui/progress.tsx'
import useAuth from '@/hooks/use-auth.tsx'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger
} from '@/components/ui/multi-select'
import { Loader2 } from 'lucide-react'
import { useCopify } from '../hooks/use-copify'
import { getFolderPath, getFileNameFromPath } from '@/utils/file-utils'
import { SubscribeBanner } from './subscribe-banner'
import { If } from '@/utils/if'
import { Checker } from '@/components/form-checker'
import { ErrorAlert } from '@/components/error-alert'

export const CopifyFormPage = () => {
  const { error, isCopifying, updateProgress } = useCopify()

  useEffect(() => {
    const unlisten = listen('copify-progress', (event) => {
      updateProgress(event.payload as number)
    })

    return () => {
      unlisten.then((f) => f())
    }
  }, [])

  return (
    <CopifyPage>
      <If condition={isCopifying} fallback={<CopifyForm />}>
        <CopifyProgress />
      </If>
      <If condition={!!error}>
        <ErrorAlert message={error} />
      </If>
    </CopifyPage>
  )
}

const CopifyPage = ({ children }: { children: React.ReactNode }) => {
  const { isPremium } = useAuth()
  const description = isPremium
    ? 'Copy project samples to project folder. Choose a folder to export multiple project at once. It is recommended to enable backups before starting a copify export.'
    : 'Copy project samples to project folder. Choose a project to get started.'

  return (
    <div className={'px-4 py-6  max-w-3xl mx-auto '}>
      <If condition={!isPremium}>
        <SubscribeBanner text={'You can only export 1 project at the time on the free plan.'} />
      </If>
      <p className="text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  )
}

const CopifyForm = () => {
  const { isPremium } = useAuth()
  const { copify, getProjectFiles, files, isProjectsLoading, form } = useCopify()
  const [folderError, setFolderError] = useState<string | undefined>()
  const { setValue } = form

  const chooseFolder = async () => {
    setFolderError(undefined)
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
      setFolderError(e)
      console.error(e)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(copify)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="folder"
          render={({ field }) => (
            <FormItem className="py-4">
              <FormLabel>{isPremium ? <>Select folder</> : <>Select project</>}</FormLabel>
              <FormControl>
                <Input onClick={chooseFolder} type="text" readOnly placeholder="..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!!folderError && <ErrorAlert message={folderError} />}
        <FormField
          control={form.control}
          name="exclude_files"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select projects to exclude</FormLabel>
              <FormControl>
                <MultiSelector values={field.value ?? []} onValuesChange={field.onChange} loop>
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
          control={form.control}
          name="serum_noises"
          title="Copy Serum noises"
          desc="Copy Serum noises to the Samples folder"
        />
        <Checker
          disabled={!isPremium}
          control={form.control}
          name="move_samples"
          title="Move sample files"
          desc="Move samples permanently (NOT RECOMMENDED)"
        />
        <Checker
          disabled={!isPremium}
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
  )
}

const CopifyProgress = () => {
  const { isRunning, progress, restart } = useCopify()
  return (
    <>
      <p className={`pt-8 text-muted-foreground ${isRunning && 'animate-pulse'}`}>
        {isRunning ? 'Copify in progress' : 'Copify finished'}
      </p>
      <If condition={progress > 0}>
        <Progress value={progress} className="w-full my-4" />
      </If>
      <If condition={!isRunning}>
        <div className="flex space-x-8">
          <Button className="my-4" onClick={restart}>
            Export another one!
          </Button>
        </div>
      </If>
    </>
  )
}
