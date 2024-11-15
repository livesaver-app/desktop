import { Dashboard } from '@/app/dashboard/page.tsx'
import { ThemeProvider } from '@/components/theme-provider.tsx'
import { DraggableTopBar } from '@/components/top-bar.tsx'

function App() {
  return (
    <ThemeProvider defaultTheme={"dark"} storageKey={"vite-ui-theme"}>
      <DraggableTopBar />
      <Dashboard />
    </ThemeProvider>
  )
}

export default App
