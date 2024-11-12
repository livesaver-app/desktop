import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button.tsx'
import { open } from '@tauri-apps/plugin-dialog'
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

export const CopifyForm = () => {
  const formSchema = z.object({
    folder: z.string().min(1, {
      message: 'You need to choose a folder.'
    })
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  })

  const { setValue } = form

  const chooseFolder = async () => {
    try {
      const path = await open({
        directory: true,
        multiple: false
      })
      if (!path) return
      setValue('folder', path)
    } catch (e: any) {
      console.error(e)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const test = await invoke('copify', { folder: values.folder })
    console.log(test)
  }

  return (
    <div>
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
          <Button type="submit">Start</Button>
        </form>
      </Form>
    </div>
  )
}
