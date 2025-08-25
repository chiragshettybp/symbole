import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link, Loader2, Check, X, RefreshCw, Star } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface ScrapedProduct {
  title?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  images?: string[];
  currency?: string;
}

interface AddProductByUrlProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddProductByUrl = ({ open, onOpenChange, onSuccess }: AddProductByUrlProps) => {
  const [url, setUrl] = useState('');
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [productForm, setProductForm] = useState({
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
  
  const { toast } = useToast();

  const handleScrapeProduct = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsScrapingLoading(true);
    
    try {
      console.log('Scraping URL:', url);
      
      const { data, error } = await supabase.functions.invoke('scrape-product', {
        body: { url: url.trim() }
      });

      if (error) {
        console.error('Scraping error:', error);
        throw new Error(error.message || 'Failed to scrape product data');
      }

      if (!data?.product) {
        throw new Error('No product data received');
      }

      const product = data.product;
      console.log('Scraped product:', product);
      
      setScrapedData(product);
      
      // Extract brand from title (first word typically)
      const extractBrand = (title: string): string => {
        if (!title) return '';
        const words = title.trim().split(/\s+/);
        // Common sneaker brands
        const brands = ['NIKE', 'ADIDAS', 'YEEZY', 'JORDAN', 'CONVERSE', 'VANS', 'NEW BALANCE', 'PUMA', 'REEBOK'];
        for (const word of words) {
          if (brands.includes(word.toUpperCase())) {
            return word.toUpperCase();
          }
        }
        // If no known brand found, use first word
        return words[0]?.toUpperCase() || '';
      };

      // Auto-fill the form with selling price = fetched price + 400
      const sellingPrice = product.price ? (product.price + 400).toString() : '';
      const brandName = extractBrand(product.title || '');
      
      setProductForm({
        name: product.title || '',
        description: product.description || '',
        price: sellingPrice,
        original_price: product.originalPrice?.toString() || '',
        category: 'sneakers',
        brand: brandName,
        sizes: '7,7.5,8.5,9,10',
        colors: '',
        stock_count: '5',
        images: [],
        thumbnail_image: ''
      });

      // Auto-upload images immediately after scraping
      if (product.images && product.images.length > 0) {
        console.log('Auto-uploading', product.images.length, 'scraped images...');
        const imageList = product.images.slice(0, 10);
        setSelectedImages([...imageList]);
        
        // Start uploading images in background (limit to 10)
        const uploadPromises = imageList.map((imageUrl, index) => 
          uploadImageToStorage(imageUrl, index).catch(error => {
            console.warn(`Failed to upload image ${index + 1}:`, error);
            return { success: false, url: imageUrl, error: error.message }; // Fallback to original URL
          })
        );

        try {
          const uploadResults = await Promise.all(uploadPromises);
          
          const uploadedImages = uploadResults
            .map(result => result.success ? result.url : result.url) // Use original URL if upload failed
            .filter(Boolean)
            .slice(0, 10) as string[];

          const successCount = uploadResults.filter(result => result.success).length;
          
          console.log(`Image upload complete: ${successCount}/${imageList.length} uploaded to storage`);
          
          // Update form with uploaded images (mix of uploaded and original URLs)
          setProductForm(prev => ({
            ...prev,
            images: uploadedImages,
            thumbnail_image: uploadedImages[0] || imageList[0]
          }));

          if (successCount > 0) {
            toast({
              title: "Images Ready",
              description: `${successCount}/${product.images.length} images processed and saved to storage`,
            });
          } else {
            toast({
              title: "Images Ready",
              description: "Images prepared (using original URLs as backup)",
              variant: "destructive",
            });
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          // Fallback to original URLs if all uploads fail
          setProductForm(prev => ({
            ...prev,
            images: [...(product.images!.slice(0, 10))],
            thumbnail_image: product.images![0]
          }));
          
          toast({
            title: "Images Ready",
            description: "Images prepared (using original URLs)",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: "Product data scraped successfully! Images are being processed in background.",
      });
    } catch (error) {
      console.error('Error scraping product:', error);
      toast({
        title: "Error",
        description: error.message || "Unable to fetch product details from this URL. Please check and try again.",
        variant: "destructive",
      });
    } finally {
      setIsScrapingLoading(false);
    }
  };

  const uploadImageToStorage = async (imageUrl: string, index: number): Promise<{success: boolean, url: string | null, error?: string}> => {
    try {
      console.log(`Uploading image ${index + 1}:`, imageUrl);
      
      // Try different approaches for fetching the image
      let response: Response;
      
      try {
        // First try with CORS
        response = await fetch(imageUrl, {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
            'User-Agent': 'Mozilla/5.0 (compatible; ProductScraper/1.0)',
          },
          mode: 'cors',
        });
      } catch (corsError) {
        console.log('CORS failed, trying no-cors mode');
        try {
          // Fallback to no-cors mode
          response = await fetch(imageUrl, {
            method: 'GET',
            mode: 'no-cors',
          });
        } catch (noCorsError) {
          console.error('Both CORS and no-cors failed:', noCorsError);
          return { success: false, url: null, error: 'Failed to fetch image due to CORS restrictions' };
        }
      }
      
      if (!response.ok) {
        const errorMsg = `Failed to fetch image: ${response.status} ${response.statusText}`;
        console.error(errorMsg);
        return { success: false, url: null, error: errorMsg };
      }
      
      const blob = await response.blob();
      
      // Validate blob size and type
      if (blob.size === 0) {
        console.error('Received empty blob');
        return { success: false, url: null, error: 'Received empty image file' };
      }
      
      if (blob.size > 10 * 1024 * 1024) { // 10MB limit
        console.error('Image too large:', blob.size);
        return { success: false, url: null, error: 'Image file too large (max 10MB)' };
      }
      
      // Try to determine file type
      let fileExtension = 'jpg';
      if (blob.type && blob.type.startsWith('image/')) {
        fileExtension = blob.type.split('/')[1] || 'jpg';
      } else {
        // Try to guess from URL
        const urlParts = imageUrl.split('.');
        const urlExt = urlParts[urlParts.length - 1].split('?')[0].toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(urlExt)) {
          fileExtension = urlExt;
        }
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `scraped-${timestamp}-${randomId}.${fileExtension}`;
      
      console.log(`Uploading to storage: ${fileName}, size: ${blob.size}, type: ${blob.type || 'unknown'}`);
      
      // Upload to Supabase Storage with retry logic
      let uploadResult;
      let uploadError;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          uploadResult = await supabase.storage
            .from('scraped-images')
            .upload(fileName, blob, {
              contentType: blob.type || `image/${fileExtension}`,
              upsert: false,
              duplex: 'half'
            });
          
          if (!uploadResult.error) break;
          uploadError = uploadResult.error;
          console.log(`Upload attempt ${attempt} failed:`, uploadError);
          
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Wait before retry
          }
        } catch (error) {
          uploadError = error;
          console.log(`Upload attempt ${attempt} exception:`, error);
          
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      if (uploadError || !uploadResult?.data) {
        console.error('Storage upload failed after retries:', uploadError);
        return { success: false, url: null, error: `Upload failed: ${uploadError?.message || 'Unknown error'}` };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('scraped-images')
        .getPublicUrl(uploadResult.data.path);

      // Verify the uploaded file by checking if URL is accessible
      try {
        const verifyResponse = await fetch(publicUrl, { method: 'HEAD' });
        if (!verifyResponse.ok) {
          console.error('Uploaded file verification failed:', verifyResponse.status);
          return { success: false, url: null, error: 'Upload verification failed' };
        }
      } catch (verifyError) {
        console.error('Could not verify uploaded file:', verifyError);
        // Don't fail completely, just log the warning
      }

      console.log(`Image ${index + 1} uploaded successfully:`, publicUrl);
      return { success: true, url: publicUrl };
    } catch (error) {
      const errorMsg = `Unexpected error uploading image ${index + 1}: ${error.message}`;
      console.error(errorMsg, error);
      return { success: false, url: null, error: errorMsg };
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast({
        title: "Error",
        description: "Product name and price are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaveLoading(true);
    
    try {
      // Validate inputs
      const priceValue = parseFloat(productForm.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error("Please enter a valid price");
      }

      const originalPriceValue = productForm.original_price 
        ? parseFloat(productForm.original_price) 
        : null;
      
      if (originalPriceValue !== null && (isNaN(originalPriceValue) || originalPriceValue < priceValue)) {
        throw new Error("Original price must be greater than or equal to current price");
      }

      // Use images from productForm (already processed during scraping) or selected images as fallback
      let finalImages = [...productForm.images];
      
      // If no processed images but we have selected images, use original URLs as fallback
      if (finalImages.length === 0 && selectedImages.length > 0) {
        console.log('No processed images found, using original URLs as fallback');
        finalImages = [...selectedImages];
      }
      
      // Enforce max 10 images
      finalImages = finalImages.slice(0, 10);
      
      if (finalImages.length === 0) {
        toast({
          title: "Error",
          description: "Please ensure at least one image is available",
          variant: "destructive",
        });
        setIsSaveLoading(false);
        return;
      }
      
      // Determine final thumbnail image
      let finalThumbnail = productForm.thumbnail_image;
      
      if (!finalThumbnail || !finalImages.includes(finalThumbnail)) {
        finalThumbnail = finalImages[0] || null;
      }

      // Generate unique slug to avoid conflicts
      const baseSlug = productForm.name.toLowerCase().trim()
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
        name: productForm.name.trim(),
        slug: finalSlug,
        description: productForm.description?.trim() || null,
        price: priceValue,
        original_price: originalPriceValue,
        category: productForm.category,
        brand: productForm.brand?.trim() || null,
        sizes: productForm.sizes ? productForm.sizes.split(',').map(s => s.trim()).filter(s => s) : [],
        colors: productForm.colors ? productForm.colors.split(',').map(c => c.trim()).filter(c => c) : [],
        stock_count: parseInt(productForm.stock_count) || 0,
        images: finalImages,
        thumbnail_image: finalThumbnail,
        featured: false
      };

      console.log('Saving product to database:', productData);

      const { data: insertedProduct, error: insertError } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      console.log('Product saved successfully:', insertedProduct);
        
      toast({
        title: "Success",
        description: "Product saved successfully!",
      });

      // Reset form and close dialog
      setUrl('');
      setScrapedData(null);
      setSelectedImages([]);
      setProductForm({
        name: '', description: '', price: '', original_price: '',
        category: 'sneakers', brand: '', sizes: '', colors: '', 
        stock_count: '', images: [], thumbnail_image: ''
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setIsSaveLoading(false);
    }
  };

  const handleImageToggle = (imageUrl: string) => {
    setSelectedImages(prev => {
      const newSelection = prev.includes(imageUrl) 
        ? prev.filter(url => url !== imageUrl)
        : [...prev, imageUrl];
      
      // If deselecting the thumbnail image, set first remaining as thumbnail
      if (productForm.thumbnail_image === imageUrl && !newSelection.includes(imageUrl) && newSelection.length > 0) {
        setProductForm(prevForm => ({
          ...prevForm,
          thumbnail_image: newSelection[0]
        }));
      }
      
      return newSelection;
    });
  };

  const handleThumbnailSelect = (imageUrl: string) => {
    if (selectedImages.includes(imageUrl)) {
      setProductForm(prev => ({
        ...prev,
        thumbnail_image: imageUrl
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Add Product by URL
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Step 1: URL Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Enter Product URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/product-page"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleScrapeProduct}
                  disabled={isScrapingLoading || !url.trim()}
                >
                  {isScrapingLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Fetch Product
                    </>
                  )}
                </Button>
              </div>
              {scrapedData && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <Check className="h-4 w-4" />
                  Product data fetched successfully
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Review Scraped Images */}
          {scrapedData && scrapedData.images && scrapedData.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 2: Select Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {scrapedData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div 
                        className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                          selectedImages.includes(imageUrl) 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleImageToggle(imageUrl)}
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Product image ${index + 1}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        {/* Selection checkbox */}
                        <div className="absolute top-2 right-2">
                          <Checkbox 
                            checked={selectedImages.includes(imageUrl)}
                            onChange={() => handleImageToggle(imageUrl)}
                            className="bg-background"
                          />
                        </div>
                        {/* Thumbnail star icon */}
                        {selectedImages.includes(imageUrl) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`absolute top-2 left-2 h-6 w-6 rounded-full p-0 ${
                              productForm.thumbnail_image === imageUrl 
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                                : 'bg-black/50 text-white hover:bg-black/70'
                            } transition-all`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleThumbnailSelect(imageUrl);
                            }}
                          >
                            <Star 
                              className={`h-3 w-3 ${productForm.thumbnail_image === imageUrl ? 'fill-current' : ''}`}
                            />
                          </Button>
                        )}
                        {/* Thumbnail label */}
                        {productForm.thumbnail_image === imageUrl && (
                          <div className="absolute bottom-1 left-1 right-1">
                            <div className="bg-yellow-500 text-white text-xs px-1 py-0.5 rounded text-center font-medium">
                              Thumbnail
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedImages.length} of {scrapedData.images.length} images selected
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Product Form */}
          {scrapedData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 3: Review & Edit Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Product Name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  />
                  <Input
                    placeholder="Brand"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                  />
                </div>
                
                <Textarea
                  placeholder="Description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  rows={3}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Price"
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  />
                  <Input
                    placeholder="Original Price (optional)"
                    type="number"
                    step="0.01"
                    value={productForm.original_price}
                    onChange={(e) => setProductForm({...productForm, original_price: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select value={productForm.category} onValueChange={(value) => setProductForm({...productForm, category: value})}>
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
                    value={productForm.stock_count}
                    onChange={(e) => setProductForm({...productForm, stock_count: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Sizes (comma separated)"
                    value={productForm.sizes}
                    onChange={(e) => setProductForm({...productForm, sizes: e.target.value})}
                  />
                  <Input
                    placeholder="Colors (comma separated)"
                    value={productForm.colors}
                    onChange={(e) => setProductForm({...productForm, colors: e.target.value})}
                  />
                </div>

                {/* Additional Image Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Additional Images (Manual Upload)
                  </label>
                  <ImageUpload
                    images={productForm.images}
                    onImagesChange={(images) => {
                      setProductForm(prev => {
                        const limited = images.slice(0, 10);
                        const newForm = { ...prev, images: limited };
                        // If no thumbnail selected or removed, set first image as thumbnail
                        if (!newForm.thumbnail_image && limited.length > 0) {
                          newForm.thumbnail_image = limited[0];
                        }
                        return newForm;
                      });
                    }}
                    thumbnailImage={productForm.thumbnail_image}
                    onThumbnailChange={(thumbnailUrl) => 
                      setProductForm(prev => ({ ...prev, thumbnail_image: thumbnailUrl }))
                    }
                    maxImages={10}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          {scrapedData && (
            <Button 
              onClick={handleSaveProduct} 
              disabled={isSaveLoading || !productForm.name || !productForm.price}
              className="w-full sm:w-auto"
            >
              {isSaveLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Product'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};