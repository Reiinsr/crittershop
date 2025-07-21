import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

export default function Cart() {
  const { user, profile } = useAuth();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load cart from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) setCart(JSON.parse(stored));
  }, []);

  // Fetch product details for items in cart
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const ids = Object.keys(cart);
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url')
        .in('id', ids);
      if (error) setError(error.message);
      else setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, [cart]);

  const updateQuantity = (id: string, qty: number) => {
    const newCart = { ...cart, [id]: qty };
    if (qty <= 0) delete newCart[id];
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeItem = (id: string) => {
    const newCart = { ...cart };
    delete newCart[id];
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const handleOrder = async () => {
    setBuying(true);
    setError(null);
    setSuccess(null);
    try {
      if (!user || !profile) throw new Error('User info missing');
      if (products.length === 0) throw new Error('No items in cart');
      // Insert order
      const total = products.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single();
      if (orderError) throw orderError;
      // Insert order items
      const items = products.map(p => ({
        order_id: order.id,
        product_id: p.id,
        price_at_time: p.price,
        quantity: cart[p.id],
        discount_at_time: 0,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;
      setSuccess('Order placed! Please wait while your order is being accepted.');
      setCart({});
      localStorage.removeItem('cart');
    } catch (err: any) {
      setError(err.message || 'Failed to place order.');
    } finally {
      setBuying(false);
    }
  };

  const total = products.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);

  if (!user) {
    return <div className="p-8">You must be signed in to view your cart.</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : products.length === 0 ? (
            <div>Your cart is empty.</div>
          ) : (
            <div className="space-y-4">
              {products.map(product => (
                <div key={product.id} className="flex items-center gap-4 border-b pb-2">
                  <img src={product.image_url} alt={product.name} className="h-16 w-16 object-cover rounded" />
                  <div className="flex-1">
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-sm text-muted-foreground">${product.price.toFixed(2)}</div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={cart[product.id]}
                    onChange={e => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                    className="w-16 border rounded px-2 py-1"
                  />
                  <Button variant="destructive" size="sm" onClick={() => removeItem(product.id)}>
                    Remove
                  </Button>
                </div>
              ))}
              <div className="flex justify-between items-center mt-4">
                <div className="font-bold text-lg">Total: ${total.toFixed(2)}</div>
                <Button onClick={handleOrder} disabled={buying}>
                  {buying ? 'Processing...' : 'Order'}
                </Button>
              </div>
              {error && <div className="text-red-500 mt-2">{error}</div>}
              {success && <div className="text-green-600 mt-2">{success}</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 