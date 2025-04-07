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

export const CopifyForm = () => {
  const [progress, setProgress] = useState(0)
  const { isPremium } = useAuth()

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
    serum_noises: z.boolean().default(false),
    move_samples: z.boolean().default(false), // Default to false, cause we only want to copy if not specified to actually move the files
    create_backup: z.boolean().default(false)
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  })

  const { setValue } = form

  const chooseFolder = async () => {
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
    } catch (e: any) {
      console.error(e)
    }
  }

  function getFolderPath(fullPath: string): string {
    return fullPath.substring(0, fullPath.lastIndexOf('/'))
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log({ settings: values })
    await invoke('copify', { settings: values })
  }

  return (
    <div className={'px-4'}>
      <p className="text-sm text-muted-foreground py-4">
        Copify will copy/move samples from a project into its own folder so its easy to migrate
        projects from machine to machine.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="folder"
            render={({ field }) => (
              <FormItem className="py-4">
                <FormLabel>Folder to scan</FormLabel>
                <FormControl>
                  <Input
                    onClick={chooseFolder}
                    type="text"
                    readOnly
                    placeholder="No folder selected"
                    {...field}
                  />
                </FormControl>
                <FormDescription>The folder you want to scan for project files.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {isPremium ? (
            <div className="flex flex-col">
              <Checker
                control={form.control}
                name="serum_noises"
                title="Include Serum noises"
                desc="Default, we don't modify Serum noises as it can interfere with other projects. But you can include them if you want to."
              />
              <Checker
                control={form.control}
                name="move_samples"
                title="Move samples"
                desc="Move the samples? (Deafult is copy, move can interfere with other projects)"
              />
              <Checker
                control={form.control}
                name="create_backup"
                title="Backup"
                desc="Create a backup of the .als files?"
              />
            </div>
          ) : (
            <div className={'py-6 text-sm italic'}>
              <Button onClick={async () => await openUrl(`${appUrl}/account`)} variant={'link'}>
                Upgrade
              </Button>{' '}
              to get more export options.
            </div>
          )}
          <Button type="submit">Start</Button>
        </form>
      </Form>
      {progress > 0 && <Progress value={progress} className="w-full my-4" />}
    </div>
  )
}

const Checker = ({
  control,
  name,
  title,
  desc
}: {
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
        <FormItem className="py-2">
          <div className="flex items-center space-x-2">
            <FormLabel>{title}</FormLabel>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </div>
          <FormDescription>{desc}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
