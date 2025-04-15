import { AppPage } from '../app-page.tsx'
import { CopifyFormPage } from './components/copify-form.tsx'
import { CopifyProvider } from './hooks/use-copify.tsx'

export function Copify() {
  return (
    <AppPage route="Copify">
      <CopifyProvider>
        <CopifyFormPage />
      </CopifyProvider>
    </AppPage>
  )
}
