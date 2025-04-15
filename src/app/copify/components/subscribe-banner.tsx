import { Button } from '@/components/ui/button'
import { open } from '@tauri-apps/plugin-shell'
import { appUrl } from '@/lib/constants.ts'

export const SubscribeBanner = () => {
  return (
    <div className={'text-sm italic pb-2 text-red-600'}>
      You are not subscribed! Go ahead and
      <Button onClick={async () => await open(`${appUrl}/account`)} variant={'link'}>
        Upgrade
      </Button>{' '}
      to enabled the export options.
    </div>
  )
}
