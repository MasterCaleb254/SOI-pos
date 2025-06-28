import { supabase } from './supabase/client'
import { Database } from '@/types/supabase'

export async function signIn(email: string, password: string) {
  console.log('Signing in with email:', email)
  
  // First try to sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  // If sign in is successful, return the session
  if (!signInError) {
    console.log('Sign in successful')
    return { data: signInData, error: null }
  }
  
  console.log('Sign in error:', signInError.message)
  
  // If user doesn't exist, create account automatically for demo purposes
  if (signInError.message.includes('Invalid login credentials')) {
    console.log('User not found, attempting to sign up...')
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: email.split('@')[0]
        }
      }
    })
    
    if (signUpError) {
      console.error('Sign up error:', signUpError)
      return { data: null, error: signUpError }
    }
    
    console.log('User signed up, attempting to sign in...')
    
    // Try signing in again after signup
    const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (newSignInError) {
      console.error('Second sign in attempt failed:', newSignInError)
      return { data: null, error: newSignInError }
    }
    
    console.log('Sign in after sign up successful')
    return { data: newSignInData, error: null }
  }
  
  // For other errors, return the original error
  console.error('Authentication error:', signInError)
  return { data: null, error: signInError }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

export function hasPermission(userRole: string, requiredRole: string) {
  const roleHierarchy = { admin: 3, manager: 2, cashier: 1 }
  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= 
         roleHierarchy[requiredRole as keyof typeof roleHierarchy]
}