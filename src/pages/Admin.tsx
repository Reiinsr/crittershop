import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Users, Package, Settings } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CountrySelector } from '@/components/CountrySelector';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
  discount_percentage: number;
  image_url: string;
}

interface ContactInfo {
  id: string;
  google_maps_url: string;
  phone_number: string;
  email: string;
}

export default function Admin() {
  const { isAdmin, loading } = useAuthContext();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [hideAdminSignup, setHideAdminSignup] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    in_stock: true,
    discount_percentage: '',
    image_url: ''
  });

  // Contact form state
  const [contactForm, setContactForm] = useState({
    google_maps_url: '',
    phone_number: '',
    email: ''
  });

  // Admin creation form
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    country_code: '+1'
  });

  // Add a ref for the file input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<{ [orderId: string]: any[] }>({});
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [declineReason, setDeclineReason] = useState<{ [orderId: string]: string }>({});
  const [orderProfiles, setOrderProfiles] = useState<{ [userId: string]: any }>({});

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
      toast({
        title: "Access denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchContactInfo();
      fetchAdminSettings();
      fetchOrders();
    }
  }, [isAdmin]);

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
    }
  };

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .single();
      
      if (error) throw error;
      if (data) {
        setContactInfo(data);
        setContactForm({
          google_maps_url: data.google_maps_url || '',
          phone_number: data.phone_number || '',
          email: data.email || ''
        });
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  const fetchAdminSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('hide_admin_signup')
        .single();
      
      if (error) throw error;
      if (data) {
        setHideAdminSignup(data.hide_admin_signup);
      }
    } catch (error) {
      console.error('Error fetching admin settings:', error);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(ordersData || []);
    // Fetch all order items
    const { data: itemsData } = await supabase.from('order_items').select('*');
    const grouped: { [orderId: string]: any[] } = {};
    (itemsData || []).forEach(item => {
      if (!grouped[item.order_id]) grouped[item.order_id] = [];
      grouped[item.order_id].push(item);
    });
    setOrderItems(grouped);
    // Fetch all user profiles for orders
    const userIds = Array.from(new Set((ordersData || []).map((o: any) => o.user_id)));
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase.from('profiles').select('*').in('user_id', userIds);
      const profilesMap: { [userId: string]: any } = {};
      (profilesData || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
      setOrderProfiles(profilesMap);
    }
    setOrdersLoading(false);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        in_stock: productForm.in_stock,
        discount_percentage: parseInt(productForm.discount_percentage) || 0,
        image_url: productForm.image_url
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        toast({ title: "Product updated successfully" });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        
        if (error) throw error;
        toast({ title: "Product added successfully" });
      }

      setProductForm({
        name: '',
        description: '',
        price: '',
        in_stock: true,
        discount_percentage: '',
        image_url: ''
      });
      setEditingProduct(null);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Product deleted successfully" });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('contact_info')
        .update(contactForm)
        .eq('id', contactInfo?.id);
      
      if (error) throw error;
      toast({ title: "Contact information updated successfully" });
      fetchContactInfo();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAdminToggle = async () => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ hide_admin_signup: !hideAdminSignup })
        .eq('id', (await supabase.from('admin_settings').select('id').single()).data?.id);
      
      if (error) throw error;
      setHideAdminSignup(!hideAdminSignup);
      toast({ 
        title: `Admin signup ${!hideAdminSignup ? 'hidden' : 'visible'}` 
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: adminForm.email,
        password: adminForm.password,
        user_metadata: {
          full_name: adminForm.full_name,
          phone_number: adminForm.phone_number,
          country_code: adminForm.country_code,
          role: 'admin'
        }
      });

      if (error) throw error;
      
      toast({ title: "Admin account created successfully" });
      setAdminForm({
        email: '',
        password: '',
        full_name: '',
        phone_number: '',
        country_code: '+1'
      });
    } catch (error: any) {
      toast({
        title: "Error creating admin",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add image upload handler
  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setProductForm({ ...productForm, image_url: publicUrlData.publicUrl });
      toast({ title: 'Image uploaded successfully!' });
    } catch (error: any) {
      toast({ title: 'Image upload failed', description: error.message, variant: 'destructive' });
    }
  };

  // Add order status update handler
  const handleOrderStatus = async (orderId: string, status: string, reason?: string) => {
    const updates: any = { status };
    if (status === 'cancelled' && reason) updates.decline_reason = reason;
    await supabase.from('orders').update(updates).eq('id', orderId);
    fetchOrders();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Manage your store products and settings
          </p>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Contact Info
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Admin Management
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount Percentage</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        value={productForm.discount_percentage}
                        onChange={(e) => setProductForm({...productForm, discount_percentage: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">Image</Label>
                      {/* Drag-and-drop area */}
                      <div
                        onDrop={e => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleImageUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        onDragOver={e => e.preventDefault()}
                        className="border-2 border-dashed rounded p-4 text-center cursor-pointer mb-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {productForm.image_url ? (
                          <img src={productForm.image_url} alt="Preview" className="mx-auto h-24 object-contain mb-2" />
                        ) : (
                          <span>Drag & drop an image here, or click to select</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                      <Input
                        id="image"
                        type="url"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                        placeholder="Or paste an image URL"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="in-stock"
                      checked={productForm.in_stock}
                      onCheckedChange={(checked) => setProductForm({...productForm, in_stock: checked})}
                    />
                    <Label htmlFor="in-stock">In Stock</Label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </Button>
                    {editingProduct && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm({
                            name: '',
                            description: '',
                            price: '',
                            in_stock: true,
                            discount_percentage: '',
                            image_url: ''
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="font-medium">${product.price}</span>
                          {product.discount_percentage > 0 && (
                            <span className="text-sm text-destructive">-{product.discount_percentage}%</span>
                          )}
                          <span className={`text-sm ${product.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                            {product.in_stock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingProduct(product);
                            setProductForm({
                              name: product.name,
                              description: product.description || '',
                              price: product.price.toString(),
                              in_stock: product.in_stock,
                              discount_percentage: product.discount_percentage.toString(),
                              image_url: product.image_url || ''
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No products added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Update your store contact details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maps">Google Maps Embed URL</Label>
                    <Input
                      id="maps"
                      type="url"
                      value={contactForm.google_maps_url}
                      onChange={(e) => setContactForm({...contactForm, google_maps_url: e.target.value})}
                      placeholder="https://www.google.com/maps/embed?..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone Number</Label>
                    <Input
                      id="contact-phone"
                      value={contactForm.phone_number}
                      onChange={(e) => setContactForm({...contactForm, phone_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    />
                  </div>
                  <Button type="submit">Update Contact Information</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>Create New Admin</CardTitle>
                <CardDescription>Add a new administrator to your store</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-name">Full Name</Label>
                      <Input
                        id="admin-name"
                        value={adminForm.full_name}
                        onChange={(e) => setAdminForm({...adminForm, full_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-phone">Phone Number</Label>
                    <div className="flex gap-2">
                      <CountrySelector 
                        value={adminForm.country_code} 
                        onValueChange={(value) => setAdminForm({...adminForm, country_code: value})} 
                      />
                      <Input
                        id="admin-phone"
                        value={adminForm.phone_number}
                        onChange={(e) => setAdminForm({...adminForm, phone_number: e.target.value})}
                        required
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit">Create Admin Account</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>Configure your store settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Hide Admin Signup</h3>
                    <p className="text-sm text-muted-foreground">
                      Hide the admin signup option from the registration page
                    </p>
                  </div>
                  <Switch
                    checked={hideAdminSignup}
                    onCheckedChange={handleAdminToggle}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div>Loading...</div>
                ) : orders.length === 0 ? (
                  <div>No orders yet.</div>
                ) : (
                  <div className="space-y-6">
                    {orders.map(order => (
                      <div key={order.id} className="border rounded p-4">
                        <div className="mb-2 font-semibold">Order ID: {order.id}</div>
                        <div className="mb-1">User: {orderProfiles[order.user_id]?.full_name || 'N/A'} ({orderProfiles[order.user_id]?.email || 'N/A'})<br/>Phone: {orderProfiles[order.user_id]?.phone_number || 'N/A'}</div>
                        {/* Optionally fetch and show user info here */}
                        <div className="mb-1">Status: <span className="font-bold">{order.status}</span></div>
                        <div className="mb-1">Total: ${order.total_amount.toFixed(2)}</div>
                        <div className="mb-1">Created: {new Date(order.created_at).toLocaleString()}</div>
                        {order.status === 'cancelled' && order.decline_reason && (
                          <div className="mb-1 text-red-600">Decline Reason: {order.decline_reason}</div>
                        )}
                        <div className="mb-2">Items:
                          <ul className="list-disc ml-6">
                            {(orderItems[order.id] || []).map(item => (
                              <li key={item.id}>Product ID: {item.product_id}, Qty: {item.quantity}, Price: ${item.price_at_time.toFixed(2)}</li>
                            ))}
                          </ul>
                        </div>
                        {order.status === 'pending' && (
                          <div className="flex gap-2 items-center">
                            <Button size="sm" onClick={() => handleOrderStatus(order.id, 'completed')}>Accept</Button>
                            <input
                              type="text"
                              placeholder="Decline reason (optional)"
                              value={declineReason[order.id] || ''}
                              onChange={e => setDeclineReason({ ...declineReason, [order.id]: e.target.value })}
                              className="border rounded px-2 py-1 text-sm"
                            />
                            <Button size="sm" variant="destructive" onClick={() => handleOrderStatus(order.id, 'cancelled', declineReason[order.id])}>Decline</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
