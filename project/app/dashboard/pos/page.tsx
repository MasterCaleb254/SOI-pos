'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Scan, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Smartphone,
  DollarSign,
  Calculator
} from 'lucide-react'
import { toast } from 'sonner'

const mockProducts = [
  { id: '1', name: 'Milk - 1L', price: 80, barcode: '1234567890', category: 'Dairy', stock: 45 },
  { id: '2', name: 'Bread - White', price: 50, barcode: '2345678901', category: 'Bakery', stock: 30 },
  { id: '3', name: 'Rice - 2kg', price: 180, barcode: '3456789012', category: 'Grains', stock: 25 },
  { id: '4', name: 'Cooking Oil - 500ml', price: 120, barcode: '4567890123', category: 'Cooking', stock: 20 },
  { id: '5', name: 'Sugar - 1kg', price: 90, barcode: '5678901234', category: 'Pantry', stock: 35 },
  { id: '6', name: 'Eggs - 12pcs', price: 280, barcode: '6789012345', category: 'Dairy', stock: 50 },
]

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  total: number
}

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card'>('cash')
  const [barcode, setBarcode] = useState('')

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
  )

  const addToCart = (product: typeof mockProducts[0]) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ))
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      }])
    }
    toast.success(`${product.name} added to cart`)
  }

  const updateQuantity = (id: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change)
        return newQuantity === 0 
          ? item 
          : { ...item, quantity: newQuantity, total: newQuantity * item.price }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
    toast.success('Item removed from cart')
  }

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.total, 0)
  }

  const processPayment = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    const total = getTotalAmount()
    
    // Simulate payment processing
    toast.loading('Processing payment...', { id: 'payment' })
    
    setTimeout(() => {
      toast.success(`Payment of KSh ${total} processed successfully via ${paymentMethod.toUpperCase()}`, { id: 'payment' })
      setCart([])
      setSearchTerm('')
      setBarcode('')
    }, 2000)
  }

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const product = mockProducts.find(p => p.barcode === barcode)
    if (product) {
      addToCart(product)
      setBarcode('')
    } else {
      toast.error('Product not found')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Product Search & Selection */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Product Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products by name or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Barcode Scanner */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Scan className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Scan or enter barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Product Grid */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex flex-col space-y-2">
                    <h3 className="font-medium text-sm">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        KSh {product.price}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {product.stock} left
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="text-xs w-fit">
                      {product.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart & Checkout */}
      <div className="space-y-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Shopping Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">KSh {item.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-2 py-1 bg-white rounded text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Separator />

            {/* Total */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Subtotal:</span>
                <span className="font-bold">KSh {getTotalAmount()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Tax (16%):</span>
                <span className="font-bold">KSh {Math.round(getTotalAmount() * 0.16)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-green-600">
                  KSh {Math.round(getTotalAmount() * 1.16)}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <p className="font-medium text-sm">Payment Method:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === 'mpesa' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('mpesa')}
                >
                  <Smartphone className="h-4 w-4 mr-1" />
                  M-Pesa
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Card
                </Button>
              </div>
            </div>

            {/* Checkout Button */}
            <Button 
              onClick={processPayment}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              disabled={cart.length === 0}
            >
              Process Payment - KSh {Math.round(getTotalAmount() * 1.16)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}