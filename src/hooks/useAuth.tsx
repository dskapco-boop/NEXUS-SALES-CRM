import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  first_name?: string
  last_name?: string
  email: string
  phone?: string
  role_id?: string
  role?: {
    id: string
    name: string
    display_name: string
    permissions: Record<string, string>
  }
  status: 'active' | 'inactive' | 'suspended'
  view_permission: 'global' | 'team' | 'individual'
  avatar_url?: string
}

interface AuthContextType {
  user: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, profile?: Partial<UserProfile>) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<UserProfile | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (session: Session | null): Promise<UserProfile | null> => {
    if (!session?.user) return null
    
    try {
      const { data: profileData, error } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          role_id,
          status,
          view_permission,
          avatar_url,
          roles (id, name, display_name, permissions)
        `)
        .eq('id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return profileData as UserProfile
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    const profile = await fetchUserProfile(session)
    setUser(profile)
    return profile
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      const profile = await fetchUserProfile(session)
      setUser(profile)
      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        const profile = await fetchUserProfile(session)
        setUser(profile)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error) {
        const { data: { session } } = await supabase.auth.getSession()
        const profile = await fetchUserProfile(session)
        setUser(profile)
      }

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, profile?: Partial<UserProfile>) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (!error && profile) {
        const { user: newUser } = await supabase.auth.getUser()
        await supabaseAdmin.from('users').insert({
          id: newUser?.id,
          email,
          ...profile,
        })
      }

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
