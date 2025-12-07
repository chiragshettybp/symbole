import { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarRating } from './StarRating';
import { cn } from '@/lib/utils';

interface WriteReviewFormProps {
  productName?: string;
  productImage?: string;
  productPrice?: number;
  onSubmit: (data: {
    rating: number;
    reviewText?: string;
    photos?: File[];
    userName: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export const WriteReviewForm = ({
  productName,
  productImage,
  productPrice,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}: WriteReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [userName, setUserName] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 5 - photos.length;
    const newFiles = files.slice(0, remainingSlots);

    setPhotos((prev) => [...prev, ...newFiles]);

    // Create previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    if (!userName.trim()) return;

    onSubmit({
      rating,
      reviewText: reviewText.trim() || undefined,
      photos: photos.length > 0 ? photos : undefined,
      userName: userName.trim(),
    });
  };

  const isValid = rating > 0 && userName.trim().length > 0;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Product Info */}
      {productName && (
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
            {productImage ? (
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No img
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{productName}</h3>
            {productPrice && (
              <p className="text-sm text-foreground font-semibold mt-1">
                ₹{productPrice.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">How is your order?</h2>
        </div>

        {/* Name Input */}
        <div className="space-y-2">
          <Label htmlFor="userName">Your Name</Label>
          <Input
            id="userName"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Rating */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">Your overall rating</p>
          <div className="flex justify-center">
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={setRating}
            />
          </div>
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <Label htmlFor="review">Add detailed review</Label>
          <Textarea
            id="review"
            placeholder="Enter here"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={5}
            className="bg-background resize-none"
          />
        </div>

        {/* Photo Upload */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />

          {photoPreviews.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Camera className="w-4 h-4" />
              add photo ({photos.length}/5)
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
};
