'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, Store, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { z } from 'zod'

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type FormData = z.infer<typeof loginSchema>
type FormErrors = Partial<Record<keyof FormData, string>>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    try {
      loginSchema.parse(formData)
      setErrors({})
      setIsLoading(true)
      
      // Sign in with Supabase
      const { error, data } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      
      if (error) throw error
      
      // If we get here, login was successful
      console.log('Login successful, user:', data.user)
      toast.success('Login successful')
      
      // Get the redirect path (default to '/dashboard')
      const redirectPath = searchParams.get('redirectedFrom') || '/dashboard'
      console.log('Login successful, redirecting to:', redirectPath)
      
      // Add a small delay to ensure the session is fully established
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Force a full page reload to ensure all auth state is properly set
      window.location.replace(redirectPath)
      
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle form validation errors
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.reduce((acc, curr) => ({
          ...acc,
          [curr.path[0]]: curr.message
        }), {} as FormErrors)
        setErrors(fieldErrors)
        return
      }
      
      // Handle auth errors
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password')
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please verify your email before signing in')
      } else {
        toast.error('An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Check for existing session on mount and redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session check error:', error)
          return
        }
        
        if (session?.user) {
          const redirectPath = searchParams.get('redirectedFrom') || '/dashboard'
          console.log('Already logged in, redirecting to:', redirectPath)
          // Add a small delay to ensure any UI updates complete
          await new Promise(resolve => setTimeout(resolve, 300))
          // Use replace instead of href to prevent adding to browser history
          window.location.replace(redirectPath)
          return
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsLoading(false)
        setIsMounted(true)
      }
    }
    
    checkSession()
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Any cleanup if needed
    }
  }, [searchParams, supabase.auth])

  // Show loading state while checking session
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center text-white">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">SOI Supermarket</h1>
          <p className="text-blue-100">Sign in to your POS system</p>
        </div>
        
        {/* Main Content */}
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className={`h-11 ${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`h-11 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>
            
            {/* Submit Button */}
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-base font-medium shadow-md transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-75"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In to Your Account'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        
        {/* Footer */}
        <CardFooter className="bg-gray-50 px-6 py-4 border-t">
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              href="/signup" 
              className="font-medium text-blue-600 hover:underline"
            >
              Contact administrator
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
