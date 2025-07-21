import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
  discount_percentage: number;
  image_url: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const { user } = useAuthContext();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (productId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    setCart(prev => {
      const newCart = {
        ...prev,
        [productId]: (prev[productId] || 0) + 1
      };
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });

    toast({
      title: "Added to cart",
      description: "Item added to your cart successfully",
    });
  };

  const getDiscountedPrice = (price: number, discount: number) => {
    return price - (price * discount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Our Products</h1>
          <p className="text-xl text-muted-foreground">
            Discover amazing products for your beloved animals
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="h-48 bg-muted flex items-center justify-center">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground">No image</div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <div className="flex gap-1">
                    {!product.in_stock && (
                      <Badge variant="secondary">Out of Stock</Badge>
                    )}
                    {product.discount_percentage > 0 && (
                      <Badge variant="destructive">-{product.discount_percentage}%</Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="mb-3">
                  {product.description}
                </CardDescription>
                <div className="flex items-center gap-2 mb-3">
                  {product.discount_percentage > 0 ? (
                    <>
                      <span className="text-lg font-bold">
                        ${getDiscountedPrice(product.price, product.discount_percentage).toFixed(2)}
                      </span>
                      <span className="text-sm line-through text-muted-foreground">
                        ${product.price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button 
                  onClick={() => addToCart(product.id)}
                  disabled={!product.in_stock}
                  className="w-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                  {cart[product.id] && (
                    <span className="ml-2 bg-primary-foreground text-primary px-2 py-1 rounded-full text-xs">
                      {cart[product.id]}
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No products available</h3>
            <p className="text-muted-foreground">Check back later for new arrivals!</p>
          </div>
        )}
      </div>
    </div>
  );
}