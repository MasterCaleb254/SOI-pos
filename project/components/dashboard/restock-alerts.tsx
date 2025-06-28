'use client'

import { useState } from 'react';
import { AlertTriangle, Check, Package, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRestockAlerts } from '@/hooks/useRestockAlerts';
import { toast } from '@/hooks/use-toast';

export function RestockAlerts() {
  const { alerts, loading, error } = useRestockAlerts();
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const handleAction = async (alertId: string, action: 'acknowledge' | 'complete', quantity?: number) => {
    try {
      setProcessing(prev => ({ ...prev, [alertId]: true }));
      
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action,
          ...(quantity && { quantity })
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update alert');
      }

      toast({
        title: 'Success',
        description: `Alert ${action === 'acknowledge' ? 'acknowledged' : 'marked as completed'}`,
      });
    } catch (error) {
      console.error(`Error ${action} alert:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setProcessing(prev => ({ ...prev, [alertId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'acknowledged':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Acknowledged</Badge>;
      case 'restocked':
        return <Badge variant="default" className="bg-green-100 text-green-800">Restocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Restock Alerts
          </CardTitle>
          <CardDescription>Loading restock alerts...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error loading restock alerts</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pendingAlerts = alerts.filter(alert => alert.status === 'pending');
  const otherAlerts = alerts.filter(alert => alert.status !== 'pending');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <CardTitle>Restock Alerts</CardTitle>
            {pendingAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingAlerts.length} Pending
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>Products that need to be restocked</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No restock alerts at this time.
          </div>
        ) : (
          <div className="divide-y">
            {[...pendingAlerts, ...otherAlerts].map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {alert.products?.name || 'Unknown Product'}
                      </h4>
                      {getStatusBadge(alert.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current: {alert.current_stock} • Min: {alert.min_stock_level}
                      {alert.products?.barcode && ` • ${alert.products.barcode}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {alert.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(alert.id, 'acknowledge')}
                          disabled={processing[alert.id]}
                        >
                          {processing[alert.id] ? (
                            <RotateCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Acknowledge
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            const quantity = prompt(
                              `How many units of ${alert.products?.name || 'this product'} were restocked?`,
                              (alert.min_stock_level * 2).toString()
                            );
                            if (quantity && !isNaN(parseInt(quantity))) {
                              handleAction(alert.id, 'complete', parseInt(quantity));
                            }
                          }}
                          disabled={processing[alert.id]}
                        >
                          {processing[alert.id] ? (
                            <RotateCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Package className="h-4 w-4 mr-1" />
                          )}
                          Mark as Restocked
                        </Button>
                      </>
                    )}
                    {alert.status === 'acknowledged' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          const quantity = prompt(
                            `How many units of ${alert.products?.name || 'this product'} were restocked?`,
                            (alert.min_stock_level * 2).toString()
                          );
                          if (quantity && !isNaN(parseInt(quantity))) {
                            handleAction(alert.id, 'complete', parseInt(quantity));
                          }
                        }}
                        disabled={processing[alert.id]}
                      >
                        {processing[alert.id] ? (
                          <RotateCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Package className="h-4 w-4 mr-1" />
                        )}
                        Mark as Restocked
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
