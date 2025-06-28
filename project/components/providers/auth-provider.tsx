'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isLoading: boolean
  signOut: () => Promise<void>
  error: Error | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Timeout for profile operations (5 seconds)
const PROFILE_TIMEOUT = 5000

// Create a minimal profile for error cases
const createFallbackProfile = (user: User): Profile => ({
  id: user.id,
  email: user.email!,
  full_name: user.email!.split('@')[0],
  role: 'cashier',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_active: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const clearProfileTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }, [])

  const fetchOrCreateProfile = useCallback(async (user: User) => {
    clearProfileTimeout()
    
    // Set a timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      console.warn('Profile fetch timed out, using fallback profile')
      setProfile(createFallbackProfile(user))
      setLoading(false)
      setError(new Error('Profile fetch timed out'))
    }, PROFILE_TIMEOUT)

    try {
      // First try to fetch existing profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError?.code === 'PGRST116' || fetchError?.code === '22P02' || fetchError?.code === '42P01') {
        // Profile doesn't exist, create one
        const newProfile = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email!.split('@')[0],
          role: 'cashier' as const,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
          throw createError
        }

        console.log('Created new profile:', createdProfile)
        clearProfileTimeout()
        setProfile(createdProfile as Profile)
      } else if (fetchError) {
        console.error('Error fetching profile:', fetchError)
        throw fetchError
      } else if (profile) {
        console.log('Found existing profile:', profile)
        clearProfileTimeout()
        setProfile(profile as Profile)
      }
    } catch (err) {
      console.error('Error with profile:', err)
      setError(err as Error)
      setProfile(createFallbackProfile(user))
    } finally {
      clearProfileTimeout()
      setLoading(false)
    }
  }, [clearProfileTimeout])

  useEffect(() => {
    let isMounted = true
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchOrCreateProfile(session.user)
        } else {
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Auth initialization error:', err)
          setError(err as Error)
          setLoading(false)
        }
      }
    }
    
    initializeAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchOrCreateProfile(session.user)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearProfileTimeout()
    }
  }, [fetchOrCreateProfile, clearProfileTimeout])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Error signing out:', err)
      setError(err as Error)
    }
  }

  const contextValue = {
    user,
    profile,
    loading,
    isLoading: loading,
    signOut,
    error
  }

  console.log('AuthProvider state:', { user, profile, loading, error })

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}