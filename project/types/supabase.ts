export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'manager' | 'cashier'
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'manager' | 'cashier'
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'manager' | 'cashier'
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      products: {
        Row: {
          id: string
          name: string
          barcode: string
          price: number
          stock_quantity: number
          min_stock_level: number
          category: string
          expiry_date: string | null
          supplier: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          barcode: string
          price: number
          stock_quantity: number
          min_stock_level: number
          category: string
          expiry_date?: string | null
          supplier: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          barcode?: string
          price?: number
          stock_quantity?: number
          min_stock_level?: number
          category?: string
          expiry_date?: string | null
          supplier?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          cashier_id: string
          total_amount: number
          payment_method: 'cash' | 'mpesa' | 'card'
          mpesa_reference: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cashier_id: string
          total_amount: number
          payment_method: 'cash' | 'mpesa' | 'card'
          mpesa_reference?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cashier_id?: string
          total_amount?: number
          payment_method?: 'cash' | 'mpesa' | 'card'
          mpesa_reference?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
          updated_at?: string
        }
      }
      transaction_items: {
        Row: {
          id: string
          transaction_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values: any
          new_values: any
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values?: any
          new_values?: any
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string
          old_values?: any
          new_values?: any
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      restock_alerts: {
        Row: {
          id: string
          product_id: string
          current_stock: number
          min_stock_level: number
          status: 'pending' | 'acknowledged' | 'restocked'
          created_at: string
          acknowledged_at: string | null
          acknowledged_by: string | null
        }
        Insert: {
          id?: string
          product_id: string
          current_stock: number
          min_stock_level: number
          status?: 'pending' | 'acknowledged' | 'restocked'
          created_at?: string
          acknowledged_at?: string | null
          acknowledged_by?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          current_stock?: number
          min_stock_level?: number
          status?: 'pending' | 'acknowledged' | 'restocked'
          created_at?: string
          acknowledged_at?: string | null
          acknowledged_by?: string | null
        }
      }
    }
  }
}