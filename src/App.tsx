import { Dashboard } from '@/app/dashboard/page.tsx'
import { ThemeProvider } from '@/components/theme-provider.tsx'
import { DraggableTopBar } from '@/components/top-bar.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Copify } from './app/copify'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/copify',
    element: <Copify />
  }
])

function App() {
  return (
    <ThemeProvider defaultTheme={'dark'} storageKey={'vite-ui-theme'}>
      <DraggableTopBar />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
