import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useRealtimeInventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Set up real-time subscription
    const channel = supabase
      .channel('products')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('Change received!', payload);
          setProducts((currentProducts) => {
            switch (payload.eventType) {
              case 'INSERT':
                return [...currentProducts, payload.new];
              case 'UPDATE':
                return currentProducts.map((product) =>
                  product.id === payload.new.id ? { ...product, ...payload.new } : product
                );
              case 'DELETE':
                return currentProducts.filter((product) => product.id !== payload.old.id);
              default:
                return currentProducts;
            }
          });
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { products, loading, error };
}
