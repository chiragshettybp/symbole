import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  brand: string;
  thumbnail_image?: string;
  images?: string[];
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, brand, thumbnail_image, images')
        .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .neq('visible', false)
        .limit(8);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchProducts(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, searchProducts]);

  const handleProductClick = (slug: string) => {
    onOpenChange(false);
    setQuery('');
    navigate(`/product/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" onKeyDown={handleKeyDown}>
        <VisuallyHidden>
          <DialogTitle>Search Products</DialogTitle>
        </VisuallyHidden>
        
        <div className="flex items-center border-b border-border px-4">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          <Input
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-14 text-base"
            autoFocus
            aria-label="Search products"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuery('')}
              className="h-8 w-8 flex-shrink-0"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8" role="status" aria-label="Loading results">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <p>No products found for "{query}"</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <ul className="divide-y divide-border" role="listbox" aria-label="Search results">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    onClick={() => handleProductClick(product.slug)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors focus:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    role="option"
                  >
                    <img
                      src={product.thumbnail_image || product.images?.[0] || '/placeholder.svg'}
                      alt={`${product.name} product image`}
                      className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.brand} • ₹{product.price}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!query && (
            <div className="py-8 text-center text-muted-foreground">
              <p>Start typing to search products...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
