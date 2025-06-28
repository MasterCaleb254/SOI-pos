import { createClient } from '@/lib/supabase/server';

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock_level: number;
  updated_at: string;
}

interface RestockAlert {
  id?: string;
  product_id: string;
  product_name: string;
  current_quantity: number;
  min_quantity: number;
  status: 'pending' | 'acknowledged' | 'completed';
  created_at?: string;
  updated_at?: string;
  acknowledged_by?: string;
  acknowledged_at?: string | null;
  completed_by?: string | null;
  completed_at?: string | null;
}

// Check for low stock items and create restock alerts if needed
export async function checkAndCreateRestockAlerts(): Promise<RestockAlert[]> {
  const supabase = createClient();
  
  try {
    // Find products that are at or below minimum stock level
    const { data: lowStockProducts, error } = await supabase
      .from('products')
      .select('*')
      .lte('stock_quantity', 10) // Replace with actual min stock level logic
      .eq('is_active', true)
      .returns<Product[]>();

    if (error) throw error;

    // For each low stock product, create or update a restock alert
    const newAlerts = await Promise.all(
      lowStockProducts.map(async (product: Product) => {
        // Check if there's already a pending alert for this product
        const { data: existingAlerts, error: fetchError } = await supabase
          .from('restock_alerts')
          .select('*')
          .eq('product_id', product.id)
          .in('status', ['pending', 'acknowledged'])
          .returns<RestockAlert[]>()
          .single();

        if (existingAlerts) {
          // Update existing alert
          const { data: updatedAlert } = await supabase
            .from('restock_alerts')
            .update({
              current_stock: product.stock_quantity,
              min_stock_level: product.min_stock_level,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAlerts.id)
            .select()
            .returns<RestockAlert[]>()
            .single();
          
          return updatedAlert;
        } else {
          // Create new alert
          const { data, error: insertError } = await supabase
            .from('restock_alerts')
            .insert({
              product_id: product.id,
              product_name: product.name,
              current_quantity: product.stock_quantity,
              min_quantity: product.min_stock_level,
              status: 'pending' as const,
            })
            .select()
            .returns<RestockAlert[]>()
            .single();
          
          return data;
        }
      })
    );

    // Log the alerts in audit log
    if (!newAlerts || newAlerts.length === 0) {
      return [];
    }

    const validAlerts = newAlerts.filter((alert): alert is RestockAlert => Boolean(alert));
    
    if (validAlerts.length > 0) {
      await Promise.all(
        validAlerts.map(alert => 
          supabase.from('audit_logs').insert({
            action: 'restock_alert_created',
            table_name: 'restock_alerts',
            record_id: alert.id,
            new_values: {
              product_id: alert.product_id,
              current_stock: alert.current_quantity,
              min_stock_level: alert.min_quantity,
              status: alert.status
            }
          })
        )
      );
    }
    
    return validAlerts;
  } catch (error) {
    console.error('Error checking restock alerts:', error);
    throw error;
  }
}

// Acknowledge a restock alert
export async function acknowledgeRestockAlert(alertId: string, userId: string): Promise<{ data: RestockAlert[] | null; error: any }> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('restock_alerts')
      .update({
        status: 'acknowledged' as const,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .select()
      .returns<RestockAlert[]>()
      .single();

    if (error) throw error;

    // Log the acknowledgment
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'restock_alert_acknowledged',
      table_name: 'restock_alerts',
      record_id: alertId,
      new_values: {
        status: 'acknowledged',
        acknowledged_at: data.acknowledged_at,
        acknowledged_by: data.acknowledged_by
      }
    });

    return { 
      data: data ? [data] : [], 
      error: null 
    };
  } catch (error) {
    console.error('Error acknowledging restock alert:', error);
    throw error;
  }
}

// Mark a restock alert as completed
export async function completeRestockAlert(
  alertId: string, 
  userId: string, 
  restockedQuantity: number
): Promise<{ data: RestockAlert[] | null; error: any }> {
  const supabase = createClient();
  
  try {
    // Get the alert first to get product details
    const { data: alert, error: fetchError } = await supabase
      .from('restock_alerts')
      .select('*')
      .eq('id', alertId)
      .single<RestockAlert>();

    if (fetchError) throw fetchError;
    if (!alert) throw new Error('Alert not found');

    // First get the current product to calculate new stock
    const { data: currentProduct, error: getProductError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', alert.product_id)
      .single();

    if (getProductError) throw getProductError;
    if (!currentProduct) throw new Error('Product not found');

    // Calculate new stock quantity
    const newStockQuantity = (currentProduct.stock_quantity || 0) + restockedQuantity;

    // Update the product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
        stock_quantity: newStockQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', alert.product_id)
      .select()
      .single();

    if (productError) throw productError;

    // Update the alert status
    const { data, error: updateError } = await supabase
      .from('restock_alerts')
      .update({
        status: 'completed' as const,
        completed_by: userId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .select()
      .returns<RestockAlert[]>()
      .single();

    if (updateError) throw updateError;

    // Log the restock
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'inventory_restocked',
      table_name: 'products',
      record_id: alert.product_id,
      new_values: {
        stock_quantity: product.stock_quantity,
        restocked_quantity: restockedQuantity,
        alert_id: alertId
      }
    });

    return { data: data ? [data] : [], error: null };
  } catch (error) {
    console.error('Error completing restock:', error);
    throw error;
  }
}
