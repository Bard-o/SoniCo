import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import api from '../lib/api'

/**
 * UserProfile mirrors the Django backend's UserProfile model.
 */
export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string
  role: 'user' | 'owner'
  created_at: string
}

interface AuthContextType {
  /** Supabase auth user (null if not logged in) */
  user: User | null
  /** Supabase session (null if not logged in) */
  session: Session | null
  /** Django UserProfile (null if not synced yet) */
  profile: UserProfile | null
  /** True while checking auth state */
  loading: boolean
  /** Sign out from Supabase and clear state */
  signOut: () => Promise<void>
  /** Refresh profile from backend */
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Sync/fetch the UserProfile from the Django backend.
   */
  const syncProfile = async (fullName?: string) => {
    try {
      const { data } = await api.post('/auth/sync/', {
        full_name: fullName || '',
      })
      setProfile(data)
    } catch (err) {
      console.error('Failed to sync profile:', err)
    }
  }

  const refreshProfile = async () => {
    try {
      const { data } = await api.get('/auth/me/')
      setProfile(data)
    } catch (err) {
      console.error('Failed to refresh profile:', err)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        syncProfile(
          currentSession.user.user_metadata?.full_name ||
          currentSession.user.user_metadata?.name || ''
        )
      }

      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await syncProfile(
            newSession.user.user_metadata?.full_name ||
            newSession.user.user_metadata?.name || ''
          )
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access the auth context.
 * Must be used inside an AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
