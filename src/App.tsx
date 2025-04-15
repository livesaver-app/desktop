import { Dashboard } from '@/app/dashboard/page.tsx'
import { ThemeProvider } from '@/components/theme-provider.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Copify } from '@/app/copify/page'
import Auth from '@/app/auth/page'
import useAuth from '@/hooks/use-auth'
import { Mover } from './app/mover/page'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/copify',
    element: <Copify />
  },
  {
    path: '/mover',
    element: <Mover />
  }
])

function App() {
  const { user } = useAuth()
  return (
    <ThemeProvider defaultTheme={'dark'} storageKey={'vite-ui-theme'}>
      {!user ? <Auth /> : <RouterProvider router={router} />}
    </ThemeProvider>
  )
}

export default App
