'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RestockAlerts } from '@/components/dashboard/restock-alerts'
import { 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  ShoppingCart,
  CreditCard,
  Activity
} from 'lucide-react'

const stats = [
  {
    name: 'Today\'s Sales',
    value: 'KSh 45,231',
    change: '+12.5%',
    changeType: 'positive',
    icon: DollarSign,
  },
  {
    name: 'Products in Stock',
    value: '1,234',
    change: '-2.3%',
    changeType: 'negative',
    icon: Package,
  },
  {
    name: 'Active Users',
    value: '23',
    change: '+4.1%',
    changeType: 'positive',
    icon: Users,
  },
  {
    name: 'Low Stock Alerts',
    value: '8',
    change: '+2',
    changeType: 'warning',
    icon: AlertTriangle,
  },
]

const recentTransactions = [
  { id: 'TXN001', amount: 'KSh 450', customer: 'Walk-in Customer', time: '2 minutes ago', status: 'completed' },
  { id: 'TXN002', amount: 'KSh 1,250', customer: 'John Doe', time: '5 minutes ago', status: 'completed' },
  { id: 'TXN003', amount: 'KSh 320', customer: 'Walk-in Customer', time: '8 minutes ago', status: 'completed' },
  { id: 'TXN004', amount: 'KSh 780', customer: 'Jane Smith', time: '12 minutes ago', status: 'pending' },
]

// Low stock items are now handled by the RestockAlerts component

export default function DashboardPage() {
  const { profile, user, loading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Only redirect if we're not already redirecting and we're not loading
    if (!loading && !user && !isRedirecting) {
      console.log('No user found, redirecting to login')
      setIsRedirecting(true)
      // Use window.location to ensure full page reload and proper auth state
      const redirectTo = `/login?redirectedFrom=${encodeURIComponent('/dashboard')}`
      window.location.href = redirectTo
    }
  }, [user, loading, isRedirecting])

  // Show loading state
  if (loading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // If no user but not in loading state, show loading (will redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || 'User'}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening at Soi Supermarket today.
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className={`text-xs ${getChangeColor(stat.changeType)}`}>
                {stat.change} from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <CardDescription>Latest sales and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{txn.amount}</p>
                    <p className="text-sm text-gray-500">{txn.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{txn.time}</p>
                    <Badge 
                      variant={txn.status === 'completed' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {txn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks based on your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <ShoppingCart className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-900">New Sale</p>
            </button>
            {(profile?.role === 'manager' || profile?.role === 'admin') && (
              <>
                <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <Package className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-900">Add Product</p>
                </button>
                <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                  <TrendingUp className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-yellow-900">View Reports</p>
                </button>
              </>
            )}
            {profile?.role === 'admin' && (
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-900">Manage Users</p>
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}