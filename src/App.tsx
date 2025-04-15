import { ThemeProvider } from '@/components/theme-provider.tsx'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Copify } from '@/app/copify/page'
import Auth from '@/app/auth/page'
import useAuth from '@/hooks/use-auth'
import { Mover } from './app/mover/page'

const router = createBrowserRouter([
  {
    path: '/',
    // element: <Dashboard />
    element: <Navigate to={'/copify'} />
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
      <div data-tauri-drag-region className="z-50 h-8  fixed w-full py-2 top-0"></div>
      {!user ? <Auth /> : <RouterProvider router={router} />}
    </ThemeProvider>
  )
}

export default App
