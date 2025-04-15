import { Control } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form.tsx'
import { Switch } from '@/components/ui/switch'

export const Checker = ({
  control,
  name,
  title,
  desc,
  disabled
}: {
  disabled: boolean
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
        <FormItem className={`flex flex-row items-center justify-between rounded-lg border p-4`}>
          <div className={`space-y-0.5`}>
            <FormLabel>{title}</FormLabel>
            <FormDescription>{desc}</FormDescription>
            <FormMessage />
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              disabled={disabled}
              onCheckedChange={field.onChange}
              aria-readonly
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
