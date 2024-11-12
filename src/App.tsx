import { Dashboard } from '@/app/dashboard/page.tsx'
import { ThemeProvider } from '@/components/theme-provider.tsx'

function App() {
  return (
    <ThemeProvider defaultTheme={"dark"} storageKey={"vite-ui-theme"}>
      <Dashboard />
    </ThemeProvider>
  )
}

export default App
