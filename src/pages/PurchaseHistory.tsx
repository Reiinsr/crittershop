import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  decline_reason?: string;
}

const PurchaseHistory = () => {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setFetching(true);
      setError(null);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setOrders(data || []);
      setFetching(false);
    };
    fetchOrders();
  }, [user]);

  if (loading || fetching) return <div className="p-8">Loading...</div>;
  if (!user) return <div className="p-8">You must be logged in to view your purchase history.</div>;

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {orders.length === 0 ? (
            <div className="text-muted-foreground">No purchases found.</div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold">Order ID: {order.id}</div>
                    <div className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                  <div className="mt-2 md:mt-0 flex flex-col items-end">
                    <span className="font-medium">${order.total_amount.toFixed(2)}</span>
                    <span className="ml-0 md:ml-4 px-2 py-1 rounded bg-gray-100 text-xs font-semibold">{order.status}</span>
                    {order.status === 'completed' && (
                      <span className="text-green-600 text-xs mt-1">Order accepted!</span>
                    )}
                    {order.status === 'cancelled' && (
                      <span className="text-red-600 text-xs mt-1">Order declined{order.decline_reason ? `: ${order.decline_reason}` : ''}</span>
                    )}
                    {order.status === 'pending' && (
                      <span className="text-yellow-600 text-xs mt-1">Waiting for admin approval...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseHistory; 