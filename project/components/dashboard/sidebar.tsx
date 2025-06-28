'use client'

import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-provider'
import { hasPermission } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  AlertTriangle,
  Store,
  X,
  Activity,
  CreditCard,
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['cashier', 'manager', 'admin'] },
  { name: 'Point of Sale', href: '/dashboard/pos', icon: ShoppingCart, roles: ['cashier', 'manager', 'admin'] },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package, roles: ['manager', 'admin'] },
  { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCard, roles: ['manager', 'admin'] },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText, roles: ['manager', 'admin'] },
  { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['admin'] },
  { name: 'Audit Logs', href: '/dashboard/audit', icon: Activity, roles: ['admin'] },
  { name: 'Alerts', href: '/dashboard/alerts', icon: AlertTriangle, roles: ['manager', 'admin'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
]

export function Sidebar({ open, setOpen }: SidebarProps) {
  const { profile } = useAuth()
  const pathname = usePathname()

  const filteredNavigation = navigation.filter(item => 
    profile && hasPermission(profile.role, item.roles[0])
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'cashier': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Soi POS</span>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          {profile && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile.full_name}
                  </p>
                  <Badge className={`text-xs ${getRoleBadgeColor(profile.role)}`}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  onClick={() => setOpen(false)}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}