import { useState } from 'react';
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

export const useProductReviews = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch ALL reviews globally with filters
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', 'global', filter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select('*')
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
  });

  // Fetch global review stats
  const { data: stats } = useQuery({
    queryKey: ['reviewStats', 'global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating');

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
  });

  // Check if user has ever made any order (for verified badge)
  const { data: hasAnyOrder } = useQuery({
    queryKey: ['hasAnyOrder'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_email', user.email)
        .in('status', ['delivered', 'completed'])
        .limit(1);

      if (error) return false;
      return data && data.length > 0;
    },
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
        product_id: '00000000-0000-0000-0000-000000000000', // Placeholder for global reviews
        user_id: user?.id || null,
        user_name: userName,
        rating,
        review_text: reviewText || null,
        photos: photos || [],
        verified: hasAnyOrder || false,
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
      queryClient.invalidateQueries({ queryKey: ['reviews', 'global'] });
      queryClient.invalidateQueries({ queryKey: ['reviewStats', 'global'] });
      toast.success('Review submitted successfully!');
    },
    onError: () => {
      toast.error('Failed to submit review');
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
    hasAnyOrder,
    submitReview,
    uploadPhotos,
  };
};