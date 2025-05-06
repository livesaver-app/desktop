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
import React, { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger
} from '@/components/ui/multi-select'
import { Loader2 } from 'lucide-react'
import { useMover } from '../hooks/use-mover'
import { getFileNameFromPath } from '@/utils/file-utils'
import { If } from '@/utils/if'
import { Checker } from '@/components/form-checker'
import { ErrorAlert } from '@/components/error-alert'
import { ProgressBar } from '@/components/progress-bar.tsx'
import { IProgress } from '@/hooks/use-progress.tsx'

export const MoverFormPage = () => {
  const { isRunning, progress, error, isProcessing, log, restart, updateProgress } = useMover()

  useEffect(() => {
    const unlisten = listen('mover-progress', (event) => {
      updateProgress(event.payload as IProgress)
    })

    return () => {
      unlisten.then((f) => f())
    }
  }, [])

  return (
    <MoverPage>
      <If condition={isProcessing} fallback={<MoverForm />}>
        <ProgressBar
          process={'Mover'}
          isRunning={isRunning}
          progress={progress}
          log={log}
          restart={restart}
        />
      </If>
      <If condition={!!error}>
        <ErrorAlert message={error} />
      </If>
    </MoverPage>
  )
}

const MoverPage = ({ children }: { children: React.ReactNode }) => {
  const description =
    "'Mover' copies project samples and moves project files to a target folder. Great for mass exporting project before moving to a new machine/hard drive. It is recommended to enable backups before starting a copify export."

  return (
    <div className={'px-4 py-6  max-w-3xl mx-auto '}>
      <p className="text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  )
}

const MoverForm = () => {
  const { process, getProjectFiles, files, isProjectsLoading, form } = useMover()
  const [folderError, setFolderError] = useState<string | undefined>()
  const { setValue } = form

  const chooseFolder = async (field: 'folder' | 'target') => {
    setFolderError(undefined)
    try {
      const directory = await open({
        directory: true,
        filters: [{ name: 'Ableton Live Project File', extensions: ['als'] }],
        multiple: false
      })
      if (!directory) return
      setValue(field, directory)

      return directory
    } catch (e: any) {
      setFolderError(e)
      console.error(e)
    }
  }

  const selectBaseFolder = async () => {
    const directory = await chooseFolder('folder')
    if (!directory) return
    await getProjectFiles(directory)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(process)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="folder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Folder</FormLabel>
              <FormControl>
                <Input
                  onClick={selectBaseFolder}
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
          name="target"
          render={({ field }) => (
            <FormItem className="">
              <FormLabel>Target folder</FormLabel>
              <FormControl>
                <Input
                  onClick={() => chooseFolder('target')}
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

        {!!folderError && <ErrorAlert message={folderError} />}
        <FormField
          control={form.control}
          name="exclude_files"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projects to exclude</FormLabel>
              <FormControl>
                <MultiSelector values={field.value ?? []} onValuesChange={field.onChange} loop>
                  <MultiSelectorTrigger>
                    {isProjectsLoading ? (
                      <span className="text-xs italic flex animate-pulse text-muted-foreground">
                        <Loader2 className="animate-spin mx-2 h-4 w-6" />
                        Scanning for .als files
                      </span>
                    ) : (
                      <MultiSelectorInput className="text-xs" placeholder={`Search projects...`} />
                    )}
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList>
                      {files?.map((path) => (
                        <MultiSelectorItem value={getFileNameFromPath(path)}>
                          {getFileNameFromPath(path)}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <h2 className="pt-6 pb-2">Export settings</h2>
        <Checker
          disabled={false}
          control={form.control}
          name="move_project_files"
          title="Move project files"
          desc="Move project files permanently. Keep unchecked to perform a copy."
        />
        <Checker
          disabled={false}
          control={form.control}
          name="serum_noises"
          title="Copy Serum noises"
          desc="Copy Serum noises to the Samples folder"
        />
        <Checker
          disabled={false}
          control={form.control}
          name="move_samples"
          title="Move sample files"
          desc="Move samples permanently (NOT RECOMMENDED)"
        />
        <Checker
          disabled={false}
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
