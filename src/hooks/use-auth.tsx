import { User } from '@supabase/supabase-js'
import { supabase } from '@/supabaseClient'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

interface IAuth {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<IAuth>({
  user: null,
  signIn: async () => {},
  logout: async () => {},
  loading: false
})

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setInitialLoading(true)
    const getUser = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (session) setUser(session.user)
    }

    getUser()
    setInitialLoading(false)

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      })
      if (error) {
        alert(error.message)
      }
    } catch (error) {
      console.error('Error logging in:', error)
    }
    setLoading(false)
  }

  const logout = async () => {
    setLoading(true)
    supabase.auth
      .signOut()
      .then(() => {
        setUser(null)
      })
      .catch((error) => alert(error))
      .finally(() => setLoading(false))
  }

  const memoedValue = useMemo(
    () => ({
      user,
      signIn,
      logout,
      loading
    }),
    [user, loading]
  )

  return (
    <AuthContext.Provider value={memoedValue}>{!initialLoading && children}</AuthContext.Provider>
  )
}

export default function useAuth() {
  return useContext(AuthContext)
}
