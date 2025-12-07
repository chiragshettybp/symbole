import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from './StarRating';
import { RatingDistribution } from './RatingDistribution';
import { ReviewFilters } from './ReviewFilters';
import { ReviewCard } from './ReviewCard';
import { WriteReviewForm } from './WriteReviewForm';
import { useProductReviews } from '@/hooks/useProductReviews';
import { cn } from '@/lib/utils';

interface ProductReviewsProps {
  productId: string;
  productName?: string;
  productImage?: string;
  productPrice?: number;
  className?: string;
}

export const ProductReviews = ({
  productId,
  productName,
  productImage,
  productPrice,
  className,
}: ProductReviewsProps) => {
  const [showWriteReview, setShowWriteReview] = useState(false);

  const {
    reviews,
    reviewsLoading,
    stats,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    submitReview,
    uploadPhotos,
  } = useProductReviews(productId);

  const handleSubmitReview = async (data: {
    rating: number;
    reviewText?: string;
    photos?: File[];
    userName: string;
  }) => {
    let photoUrls: string[] = [];

    if (data.photos && data.photos.length > 0) {
      photoUrls = await uploadPhotos(data.photos);
    }

    await submitReview.mutateAsync({
      rating: data.rating,
      reviewText: data.reviewText,
      photos: photoUrls,
      userName: data.userName,
    });

    setShowWriteReview(false);
  };

  return (
    <div className={cn('', className)}>
      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-[280px,1fr] gap-8">
        {/* Left: Rating Summary */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold text-foreground">{stats.average}</div>
            <StarRating rating={Math.round(stats.average)} size="md" className="justify-center mt-2" />
            <p className="text-sm text-muted-foreground mt-1">({stats.total} Reviews)</p>
          </div>
          <RatingDistribution distribution={stats.distribution} total={stats.total} />
        </div>

        {/* Right: Reviews List */}
        <div className="space-y-4">
          <ReviewFilters
            filter={filter}
            onFilterChange={setFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <div className="min-h-[300px]">
            {reviewsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <div>
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={() => setShowWriteReview(true)}
            className="w-full"
            size="lg"
          >
            Write Review
          </Button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-6">
        {/* Rating Summary */}
        <div className="flex items-start gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground">{stats.average}</div>
            <StarRating rating={Math.round(stats.average)} size="sm" className="justify-center mt-1" />
            <p className="text-xs text-muted-foreground mt-1">({stats.total} Reviews)</p>
          </div>
          <RatingDistribution
            distribution={stats.distribution}
            total={stats.total}
            className="flex-1"
          />
        </div>

        {/* Filters */}
        <ReviewFilters
          filter={filter}
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Reviews List */}
        <div className="min-h-[200px]">
          {reviewsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>

        {/* Sticky Write Review Button */}
        <div className="sticky bottom-0 bg-background pt-4 pb-2">
          <Button
            onClick={() => setShowWriteReview(true)}
            className="w-full"
            size="lg"
          >
            Write Review
          </Button>
        </div>
      </div>

      {/* Write Review Sheet */}
      <Sheet open={showWriteReview} onOpenChange={setShowWriteReview}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Write a Review</SheetTitle>
          </SheetHeader>
          <WriteReviewForm
            productName={productName}
            productImage={productImage}
            productPrice={productPrice}
            onSubmit={handleSubmitReview}
            onCancel={() => setShowWriteReview(false)}
            isSubmitting={submitReview.isPending}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};
