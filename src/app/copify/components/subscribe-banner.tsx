import { Button } from '@/components/ui/button'
import { open } from '@tauri-apps/plugin-shell'
import { appUrl } from '@/lib/constants.ts'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const SubscribeBanner = ({ text }: { text: string }) => {
  return (
    <Alert variant={'destructive'} className="flex items-center justify-center mb-6">
      <AlertDescription className="flex justify-between items-center">
        {text}
        <Button onClick={async () => await open(`${appUrl}/account`)} variant={'link'}>
          Get started with Premium
        </Button>
      </AlertDescription>
    </Alert>
  )
}
