import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  review_text: string | null;
  photos: string[];
  verified: boolean;
  created_at: string;
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: { [key: number]: number };
}

export type ReviewFilter = 'all' | 'verified' | 'latest' | 'detailed';

export const useProductReviews = (productId: string) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch reviews with filters
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', productId, filter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (filter === 'verified') {
        query = query.eq('verified', true);
      } else if (filter === 'detailed') {
        query = query.not('review_text', 'is', null);
      }

      if (searchQuery) {
        query = query.ilike('review_text', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!productId,
  });

  // Fetch review stats
  const { data: stats } = useQuery({
    queryKey: ['reviewStats', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId);

      if (error) throw error;

      const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let total = 0;
      let sum = 0;

      data.forEach((review) => {
        distribution[review.rating]++;
        sum += review.rating;
        total++;
      });

      return {
        average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
        total,
        distribution,
      } as ReviewStats;
    },
    enabled: !!productId,
  });

  // Check if user has already reviewed
  const { data: userReview } = useQuery({
    queryKey: ['userReview', productId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!productId,
  });

  // Check if user has purchased the product (for verified badge)
  const { data: hasPurchased } = useQuery({
    queryKey: ['hasPurchased', productId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('orders')
        .select('id, items')
        .eq('customer_email', user.email)
        .in('status', ['delivered', 'completed']);

      if (error) return false;

      // Check if any order contains this product
      return data.some((order) => {
        const items = order.items as any[];
        return items?.some((item) => item.product_id === productId);
      });
    },
    enabled: !!productId,
  });

  // Submit review mutation
  const submitReview = useMutation({
    mutationFn: async ({
      rating,
      reviewText,
      photos,
      userName,
    }: {
      rating: number;
      reviewText?: string;
      photos?: string[];
      userName: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const reviewData = {
        product_id: productId,
        user_id: user?.id || null,
        user_name: userName,
        rating,
        review_text: reviewText || null,
        photos: photos || [],
        verified: hasPurchased || false,
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['reviewStats', productId] });
      queryClient.invalidateQueries({ queryKey: ['userReview', productId] });
      toast.success('Review submitted successfully!');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('You have already reviewed this product');
      } else {
        toast.error('Failed to submit review');
      }
    },
  });

  // Upload photos
  const uploadPhotos = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('review-photos')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('review-photos')
        .getPublicUrl(data.path);

      urls.push(publicUrl);
    }

    return urls;
  };

  return {
    reviews,
    reviewsLoading,
    stats: stats || { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    userReview,
    hasPurchased,
    submitReview,
    uploadPhotos,
  };
};
