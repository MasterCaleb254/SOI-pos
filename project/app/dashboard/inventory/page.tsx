'use client'

import { useState, useEffect } from 'react'
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Package,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingDown,
  Search,
  Filter
} from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'

type ProductStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired';

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  supplier: string;
  expiryDate: string;
  status: ProductStatus;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Milk - 1L',
    barcode: '1234567890',
    price: 80,
    stock: 5,
    minStock: 20,
    category: 'Dairy',
    supplier: 'Fresh Dairy Ltd',
    expiryDate: '2024-02-15',
    status: 'low-stock'
  },
  {
    id: '2',
    name: 'Bread - White',
    barcode: '2345678901',
    price: 50,
    stock: 8,
    minStock: 25,
    category: 'Bakery',
    supplier: 'Golden Bakery',
    expiryDate: '2024-02-10',
    status: 'low-stock'
  },
  {
    id: '3',
    name: 'Rice - 2kg',
    barcode: '3456789012',
    price: 180,
    stock: 45,
    minStock: 30,
    category: 'Grains',
    supplier: 'Quality Grains Co',
    expiryDate: '2025-12-31',
    status: 'in-stock'
  },
  {
    id: '4',
    name: 'Cooking Oil - 500ml',
    barcode: '4567890123',
    price: 120,
    stock: 0,
    minStock: 15,
    category: 'Cooking',
    supplier: 'Pure Oil Industries',
    expiryDate: '2024-08-30',
    status: 'out-of-stock'
  },
  {
    id: '5',
    name: 'Sugar - 1kg',
    barcode: '5678901234',
    price: 90,
    stock: 35,
    minStock: 20,
    category: 'Pantry',
    supplier: 'Sweet Supply Co',
    expiryDate: '2025-06-15',
    status: 'in-stock'
  }
]

export default function InventoryPage() {
    const { products: realtimeProducts, loading, error } = useRealtimeInventory()
  const [filter, setFilter] = useState<'all' | 'low-stock' | 'out-of-stock'>('all')
  const [products, setProducts] = useState<Product[]>([])

  // Transform realtime data to match our Product interface
  useEffect(() => {
    if (realtimeProducts) {
      const transformed = realtimeProducts.map(product => {
        const status: ProductStatus = 
          product.stock_quantity === 0 ? 'out-of-stock' :
          product.stock_quantity <= product.min_stock_level ? 'low-stock' :
          'in-stock';
          
        return {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          price: parseFloat(product.price as unknown as string),
          stock: product.stock_quantity,
          minStock: product.min_stock_level,
          category: product.category,
          supplier: product.supplier,
          expiryDate: product.expiry_date,
          status
        };
      });
      
      setProducts(transformed);
    }
  }, [realtimeProducts])

  const getStatusBadge = (status: string, stock: number, minStock: number) => {
    if (status === 'out-of-stock') {
      return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
    }
    if (status === 'low-stock') {
      return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Low Stock</Badge>
    }
    if (status === 'expired') {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>
    }
    return <Badge variant="default" className="text-xs bg-green-100 text-green-800">In Stock</Badge>
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('name')}</div>
          <div className="text-sm text-gray-500">{row.original.barcode}</div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.getValue('category')}
        </Badge>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <div className="font-medium">KSh {row.getValue('price')}</div>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => {
        const stock = row.getValue('stock') as number
        const minStock = row.original.minStock
        return (
          <div className="flex items-center gap-2">
            <span className={stock <= minStock ? 'text-red-600' : 'text-green-600'}>
              {stock}
            </span>
            <span className="text-gray-400">/ {minStock}</span>
            {stock <= minStock && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(
        row.getValue('status'),
        row.original.stock,
        row.original.minStock
      ),
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier',
    },
    {
      accessorKey: 'expiryDate',
      header: 'Expiry Date',
      cell: ({ row }) => {
        const date = new Date(row.getValue('expiryDate'))
        const isExpiringSoon = date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        return (
          <div className={`text-sm ${isExpiringSoon ? 'text-red-600' : 'text-gray-600'}`}>
            {date.toLocaleDateString()}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (loading) return <div className="p-8 text-center">Loading inventory...</div>
  if (error) return <div className="p-8 text-red-600">Error loading inventory: {error.message}</div>

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => p.status === filter)

  const stats = [
    {
      name: 'Total Products',
      value: products.length,
      icon: Package,
      color: 'blue'
    },
    {
      name: 'Low Stock Items',
      value: products.filter(p => p.status === 'low-stock').length,
      icon: AlertTriangle,
      color: 'yellow'
    },
    {
      name: 'Out of Stock',
      value: products.filter(p => p.status === 'out-of-stock').length,
      icon: TrendingDown,
      color: 'red'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage your product inventory and stock levels</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 text-${stat.color}-500`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Products
            </Button>
            <Button
              variant={filter === 'low-stock' ? 'default' : 'outline'}
              onClick={() => setFilter('low-stock')}
            >
              Low Stock
            </Button>
            <Button
              variant={filter === 'out-of-stock' ? 'default' : 'outline'}
              onClick={() => setFilter('out-of-stock')}
            >
              Out of Stock
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredProducts}
            searchKey="name"
            searchPlaceholder="Search products..."
          />
        </CardContent>
      </Card>
    </div>
  )
}