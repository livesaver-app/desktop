import { Dashboard } from '@/app/dashboard/page.tsx'
import { ThemeProvider } from '@/components/theme-provider.tsx'
import { DraggableTopBar } from '@/components/top-bar.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Copify } from './app/copify'
import { useState, useEffect } from 'react'
import { AuthSession } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import Auth from './app/auth'

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
  const [session, setSession] = useState<AuthSession | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  console.log(session)
  return (
    <ThemeProvider defaultTheme={'dark'} storageKey={'vite-ui-theme'}>
      {/* <DraggableTopBar /> */}
      {!session ? <Auth /> : <RouterProvider router={router} />}
    </ThemeProvider>
  )
}

export default App
