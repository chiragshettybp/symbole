import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Package, Search, Plus, Edit, Trash2, Download, RefreshCw, Eye, EyeOff, Link, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { AddProductByUrl } from '@/components/admin/AddProductByUrl';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  original_price?: number;
  images: string[];
  category: string;
  brand?: string;
  sizes: string[];
  colors: string[];
  stock_count: number;
  featured?: boolean;
  visible?: boolean;
  created_at: string;
  updated_at: string;
  thumbnail_image?: string;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    category: 'sneakers',
    brand: '',
    sizes: '',
    colors: '',
    stock_count: '',
    images: [] as string[],
    thumbnail_image: ''
  });
  
  const navigate = useNavigate();
  const { logActivity } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
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
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      toast({
        title: "Error",
        description: "Product name and price are required",
        variant: "destructive",
      });
      return;
    }

    if (newProduct.images.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one product image",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate price inputs
      const priceValue = parseFloat(newProduct.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error("Please enter a valid price");
      }

      const originalPriceValue = newProduct.original_price 
        ? parseFloat(newProduct.original_price) 
        : null;
      
      if (originalPriceValue !== null && (isNaN(originalPriceValue) || originalPriceValue < priceValue)) {
        throw new Error("Original price must be greater than or equal to current price");
      }

      // Ensure thumbnail is set and exists in images array
      let finalThumbnail = newProduct.thumbnail_image;
      if (!finalThumbnail || !newProduct.images.includes(finalThumbnail)) {
        finalThumbnail = newProduct.images[0] || null;
      }

      // Generate unique slug to avoid conflicts
      const baseSlug = newProduct.name.toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      let finalSlug = baseSlug;
      let counter = 1;
      
      // Check if slug exists and create unique one if needed
      while (true) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('slug', finalSlug)
          .single();
        
        if (!existingProduct) break;
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const productData = {
        name: newProduct.name.trim(),
        slug: finalSlug,
        description: newProduct.description?.trim() || null,
        price: priceValue,
        original_price: originalPriceValue,
        category: newProduct.category,
        brand: newProduct.brand?.trim() || null,
        sizes: newProduct.sizes ? newProduct.sizes.split(',').map(s => s.trim()).filter(s => s) : [],
        colors: newProduct.colors ? newProduct.colors.split(',').map(c => c.trim()).filter(c => c) : [],
        stock_count: parseInt(newProduct.stock_count) || 0,
        images: newProduct.images.slice(0, 10),
        thumbnail_image: finalThumbnail,
        featured: false
      };

      console.log('Saving manually added product:', productData);

      const { data: insertedProduct, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Product saved successfully:', insertedProduct);

      setShowAddDialog(false);
      setNewProduct({
        name: '', description: '', price: '', original_price: '',
        category: 'sneakers', brand: '', sizes: '', colors: '', 
        stock_count: '', images: [], thumbnail_image: ''
      });

      toast({
        title: "Success",
        description: "Product added successfully",
      });

      logActivity('create', insertedProduct.id, 'product', `Added new product: ${newProduct.name}`);
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ featured: !product.featured })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Product ${product.featured ? 'removed from' : 'added to'} featured`,
      });

      logActivity('update', product.id, 'product', 
        `${product.featured ? 'Unfeatured' : 'Featured'} product: ${product.name}`);
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error", 
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const toggleVisibility = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ visible: !product.visible })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Product ${product.visible ? 'hidden' : 'made visible'}`,
      });

      logActivity('update', product.id, 'product', 
        `${product.visible ? 'Hidden' : 'Shown'} product: ${product.name}`);
    } catch (error) {
      console.error('Error updating product visibility:', error);
      toast({
        title: "Error", 
        description: "Failed to update product visibility",
        variant: "destructive",
      });
    }
  };

  const cloneProduct = async (product: Product) => {
    try {
      // Generate unique slug for cloned product
      const baseSlug = `${product.slug}-copy`;
      let finalSlug = baseSlug;
      let counter = 1;
      
      while (true) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('slug', finalSlug)
          .maybeSingle();
        
        if (!existingProduct) break;
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const clonedProduct = {
        name: `${product.name} (Copy)`,
        slug: finalSlug,
        description: product.description,
        price: product.price,
        original_price: product.original_price,
        category: product.category,
        brand: product.brand,
        sizes: product.sizes,
        colors: product.colors,
        stock_count: product.stock_count,
        images: product.images,
        thumbnail_image: product.thumbnail_image,
        featured: false,
        visible: false, // Cloned products are hidden by default
      };

      const { data: insertedProduct, error } = await supabase
        .from('products')
        .insert([clonedProduct])
        .select()
        .single();

      if (error) throw error;

      // Open the cloned product in edit mode
      setEditingProduct(insertedProduct);

      toast({
        title: "Success",
        description: "Product cloned successfully. Edit and publish when ready.",
      });

      logActivity('create', insertedProduct.id, 'product', `Cloned product from: ${product.name}`);
    } catch (error) {
      console.error('Error cloning product:', error);
      toast({
        title: "Error",
        description: "Failed to clone product",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      // Ensure thumbnail is set and exists in images array
      let finalThumbnail = editingProduct.thumbnail_image;
      if (!finalThumbnail || !editingProduct.images.includes(finalThumbnail)) {
        finalThumbnail = editingProduct.images[0] || null;
      }

      const productData = {
        name: editingProduct.name.trim(),
        slug: editingProduct.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: editingProduct.description?.trim() || null,
        price: editingProduct.price,
        original_price: editingProduct.original_price,
        category: editingProduct.category,
        brand: editingProduct.brand?.trim() || null,
        sizes: editingProduct.sizes,
        colors: editingProduct.colors,
        stock_count: editingProduct.stock_count,
        images: editingProduct.images.slice(0, 10),
        thumbnail_image: finalThumbnail
      };

      console.log('Updating product:', productData);

      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) throw error;

      setEditingProduct(null);
      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      logActivity('update', editingProduct.id, 'product', `Updated product: ${editingProduct.name}`);
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      logActivity('delete', product.id, 'product', `Deleted product: ${product.name}`);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product", 
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const csvData = filteredProducts.map(product => ({
      id: product.id,
      name: product.name,
      brand: product.brand || '',
      category: product.category,
      price: product.price,
      original_price: product.original_price || '',
      stock_count: product.stock_count,
      featured: product.featured ? 'Yes' : 'No',
      created_at: new Date(product.created_at).toLocaleDateString(),
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    logActivity('export', null, 'products_csv_export', `Exported ${csvData.length} products to CSV`);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Product Management</h1>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              onClick={() => setShowUrlDialog(true)}
              variant="outline"
            >
              <Link className="h-4 w-4 mr-2" />
              Add Product by URL
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                  <Input
                    placeholder="Product Name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  />
                  <Input
                    placeholder="Brand"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                  />
                  <Textarea
                    placeholder="Description"
                    className="col-span-full"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  />
                  <Input
                    placeholder="Price"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  />
                  <Input
                    placeholder="Original Price (optional)"
                    type="number"
                    value={newProduct.original_price}
                    onChange={(e) => setNewProduct({...newProduct, original_price: e.target.value})}
                  />
                  <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sneakers">Sneakers</SelectItem>
                      <SelectItem value="apparel">Apparel</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Stock Count"
                    type="number"
                    value={newProduct.stock_count}
                    onChange={(e) => setNewProduct({...newProduct, stock_count: e.target.value})}
                  />
                  <Input
                    placeholder="Sizes (comma separated)"
                    value={newProduct.sizes}
                    onChange={(e) => setNewProduct({...newProduct, sizes: e.target.value})}
                  />
                  <Input
                    placeholder="Colors (comma separated)"
                    value={newProduct.colors}
                    onChange={(e) => setNewProduct({...newProduct, colors: e.target.value})}
                  />
                  <div className="col-span-full">
                    <label className="text-sm font-medium mb-2 block">
                      Product Images <span className="text-destructive">*</span>
                    </label>
                    <ImageUpload
                      images={newProduct.images}
                      onImagesChange={(images) => {
                        setNewProduct(prev => {
                          const limited = images.slice(0, 10);
                          const newForm = { ...prev, images: limited };
                          // If no thumbnail selected or removed, set first image as thumbnail
                          if (!newForm.thumbnail_image && limited.length > 0) {
                            newForm.thumbnail_image = limited[0];
                          } else if (newForm.thumbnail_image && !limited.includes(newForm.thumbnail_image)) {
                            // If current thumbnail was removed, set first remaining image
                            newForm.thumbnail_image = limited[0] || '';
                          }
                          return newForm;
                        });
                      }}
                      thumbnailImage={newProduct.thumbnail_image}
                      onThumbnailChange={(thumbnailUrl) => 
                        setNewProduct(prev => ({ ...prev, thumbnail_image: thumbnailUrl }))
                      }
                      maxImages={10}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload product images and select a thumbnail using the star icon
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button 
                    onClick={handleAddProduct} 
                    className="w-full sm:w-auto"
                    disabled={!newProduct.name || !newProduct.price || newProduct.images.length === 0}
                  >
                    Add Product
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <AddProductByUrl
              open={showUrlDialog}
              onOpenChange={setShowUrlDialog}
              onSuccess={fetchProducts}
            />
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={fetchProducts} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="sneakers">Sneakers</SelectItem>
                  <SelectItem value="apparel">Apparel</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{filteredProducts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {filteredProducts.filter(p => p.stock_count > 0).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {filteredProducts.filter(p => p.stock_count === 0).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Featured</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {filteredProducts.filter(p => p.featured).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Package className="h-4 w-4 md:h-5 md:w-5" />
              Products ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            {/* Mobile Card Layout */}
            <div className="block lg:hidden space-y-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-3 border rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                     {(product.thumbnail_image || (product.images && product.images.length > 0)) && (
                       <img 
                         src={product.thumbnail_image || product.images[0]} 
                         alt={product.name}
                         className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                       />
                     )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{product.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{product.brand || 'No Brand'}</div>
                      <Badge variant="outline" className="text-xs mt-1">{product.category}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">₹{product.price}</div>
                      {product.original_price && (
                        <div className="text-xs text-muted-foreground line-through">
                          ₹{product.original_price}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.stock_count > 0 ? "default" : "destructive"} className="text-xs">
                        {product.stock_count} in stock
                      </Badge>
                      {product.featured && (
                        <Badge variant="default" className="text-xs">Featured</Badge>
                      )}
                      {product.visible === false && (
                        <Badge variant="outline" className="text-xs">Hidden</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVisibility(product)}
                      className="h-8 px-2"
                      title={product.visible !== false ? "Hide" : "Show"}
                    >
                      {product.visible !== false ? (
                        <Eye className="h-3 w-3 text-success" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/product/${product.slug}`)}
                      className="h-8 px-2 flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cloneProduct(product)}
                      className="h-8 px-2 flex-1"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Clone
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                      className="h-8 px-2 flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProduct(product)}
                      className="h-8 px-2 flex-1"
                    >
                      <Trash2 className="h-3 w-3 mr-1 text-destructive" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Visible</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                       {(product.thumbnail_image || (product.images && product.images.length > 0)) && (
                         <img 
                           src={product.thumbnail_image || product.images[0]} 
                           alt={product.name}
                           className="w-12 h-12 object-cover rounded-md"
                         />
                       )}
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.slug}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>{product.brand || '-'}</TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {product.category}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">₹{product.price}</div>
                        {product.original_price && (
                          <div className="text-sm text-muted-foreground line-through">
                            ₹{product.original_price}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={product.stock_count > 0 ? "default" : "destructive"}>
                          {product.stock_count}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeatured(product)}
                          title={product.featured ? "Remove from featured" : "Add to featured"}
                        >
                          {product.featured ? (
                            <Badge variant="default" className="text-xs">Featured</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Not Featured</Badge>
                          )}
                        </Button>
                      </TableCell>

                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVisibility(product)}
                          title={product.visible ? "Hide product" : "Show product"}
                        >
                          {product.visible !== false ? (
                            <Eye className="h-4 w-4 text-success" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/product/${product.slug}`)}
                            title="View product"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cloneProduct(product)}
                            title="Clone product"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                            title="Edit product"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProduct(product)}
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            )}
          </CardContent>
         </Card>

        {/* Edit Product Dialog */}
        {editingProduct && (
          <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                <Input
                  placeholder="Product Name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                />
                <Input
                  placeholder="Brand"
                  value={editingProduct.brand || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})}
                />
                <Textarea
                  placeholder="Description"
                  className="col-span-full"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                />
                <Input
                  placeholder="Price"
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                />
                <Input
                  placeholder="Original Price (optional)"
                  type="number"
                  value={editingProduct.original_price || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, original_price: e.target.value ? parseFloat(e.target.value) : null})}
                />
                <Select value={editingProduct.category} onValueChange={(value) => setEditingProduct({...editingProduct, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sneakers">Sneakers</SelectItem>
                    <SelectItem value="apparel">Apparel</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Stock Count"
                  type="number"
                  value={editingProduct.stock_count}
                  onChange={(e) => setEditingProduct({...editingProduct, stock_count: parseInt(e.target.value) || 0})}
                />
                <Input
                  placeholder="Sizes (comma separated)"
                  value={editingProduct.sizes.join(', ')}
                  onChange={(e) => setEditingProduct({...editingProduct, sizes: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                />
                <Input
                  placeholder="Colors (comma separated)"
                  value={editingProduct.colors.join(', ')}
                  onChange={(e) => setEditingProduct({...editingProduct, colors: e.target.value.split(',').map(c => c.trim()).filter(c => c)})}
                />
                <div className="col-span-full">
                  <label className="text-sm font-medium mb-2 block">Product Images</label>
                  <ImageUpload
                    images={editingProduct.images}
                    onImagesChange={(images) => {
                      setEditingProduct(prev => {
                        const limited = images.slice(0, 10);
                        const updatedProduct = { ...prev, images: limited };
                        // If no thumbnail selected or removed, set first image as thumbnail
                        if (!updatedProduct.thumbnail_image && limited.length > 0) {
                          updatedProduct.thumbnail_image = limited[0];
                        } else if (updatedProduct.thumbnail_image && !limited.includes(updatedProduct.thumbnail_image)) {
                          // If current thumbnail was removed, set first remaining image
                          updatedProduct.thumbnail_image = limited[0] || undefined;
                        }
                        return updatedProduct;
                      });
                    }}
                    thumbnailImage={editingProduct.thumbnail_image}
                    onThumbnailChange={(thumbnailUrl) => 
                      setEditingProduct(prev => ({ ...prev, thumbnail_image: thumbnailUrl }))
                    }
                    maxImages={10}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingProduct(null)} className="w-full sm:w-auto">Cancel</Button>
                <Button onClick={handleUpdateProduct} className="w-full sm:w-auto">Update Product</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;