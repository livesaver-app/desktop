import { User } from '@supabase/supabase-js'
import { supabase } from '@/supabaseClient'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Profile } from '@/types/profile'

interface IAuth {
  user: User | null
  profile: Profile | null
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  isPremium: boolean
}

const AuthContext = createContext<IAuth>({
  user: null,
  profile: null,
  signIn: async () => {},
  logout: async () => {},
  loading: false,
  isPremium: false
})

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isPremium] = useState<boolean>(true) // As of now, all features are opened

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (session) setUser(session.user)
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const getProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single()
      if (error) console.error(error)
      if (data) {
        setProfile(data)
        // setIsPremium(data.subscription_plan === 'premium')
      }
    }
    if (user) getProfile()
  }, [user])

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
      profile,
      isPremium,
      signIn,
      logout,
      loading
    }),
    [user, profile, isPremium, loading]
  )

  return <AuthContext.Provider value={memoedValue}>{children}</AuthContext.Provider>
}

export default function useAuth() {
  return useContext(AuthContext)
}
