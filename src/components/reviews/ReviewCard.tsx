import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StarRating } from './StarRating';
import { cn } from '@/lib/utils';
import type { Review } from '@/hooks/useProductReviews';

interface ReviewCardProps {
  review: Review;
  className?: string;
}

export const ReviewCard = ({ review, className }: ReviewCardProps) => {
  const initials = review.user_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn('py-4 border-b border-border last:border-0', className)}>
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{review.user_name}</span>
              {review.verified && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>

          {review.review_text && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {review.review_text}
            </p>
          )}

          <div className="flex items-center gap-1 mt-2">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-sm text-foreground ml-1">{review.rating}.0</span>
          </div>

          {review.photos && review.photos.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {review.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-border"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
