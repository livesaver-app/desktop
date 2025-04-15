import useAuth from '@/hooks/use-auth'
import { AppPage } from '../app-page'
import { MoverFormPage } from './components/mover-form'
import { MoverProvider } from './hooks/use-mover'
import { If } from '@/utils/if'
import { SubscribeBanner } from '../copify/components/subscribe-banner'

export function Mover() {
  const { isPremium } = useAuth()
  return (
    <AppPage route="Mover">
      <MoverProvider>
        <If
          condition={isPremium}
          fallback={<SubscribeBanner text={'You do not have access to this feature.'} />}
        >
          <MoverFormPage />
        </If>
      </MoverProvider>
    </AppPage>
  )
}
