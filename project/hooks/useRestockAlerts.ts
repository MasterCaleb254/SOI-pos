import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useRestockAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('restock_alerts')
          .select(`
            *,
            products(name, barcode, category)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAlerts(data || []);
      } catch (err) {
        console.error('Error fetching restock alerts:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    // Set up real-time subscription
    const channel = supabase
      .channel('restock_alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restock_alerts',
        },
        (payload) => {
          console.log('Restock alert change:', payload);
          setAlerts((currentAlerts) => {
            switch (payload.eventType) {
              case 'INSERT':
                return [payload.new, ...currentAlerts];
              case 'UPDATE':
                return currentAlerts.map((alert) =>
                  alert.id === payload.new.id ? { ...alert, ...payload.new } : alert
                );
              case 'DELETE':
                return currentAlerts.filter((alert) => alert.id !== payload.old.id);
              default:
                return currentAlerts;
            }
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { alerts, loading, error };
}
