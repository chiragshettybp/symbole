import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  thumbnailImage?: string;
  onThumbnailChange?: (thumbnailUrl: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  thumbnailImage,
  onThumbnailChange
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Image file too large (max 10MB)');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      console.log('Uploading image:', fileName, 'Size:', file.size, 'Type:', file.type);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData.path);

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Verify the URL is accessible
      try {
        const verifyResponse = await fetch(data.publicUrl, { method: 'HEAD' });
        if (!verifyResponse.ok) {
          console.warn('Uploaded file verification failed, but continuing...');
        }
      } catch (verifyError) {
        console.warn('Could not verify uploaded file, but continuing...');
      }

      console.log('Image upload complete:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const url = await uploadImage(file);
        if (url) {
          newImages.push(url);
        }
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      toast({
        title: "Images uploaded",
        description: `${newImages.length} image(s) uploaded successfully`,
      });
    }

    setUploading(false);
  }, [images, maxImages, onImagesChange, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    // If removing the thumbnail image, set the first remaining image as thumbnail
    if (thumbnailImage === imageToRemove && onThumbnailChange && newImages.length > 0) {
      onThumbnailChange(newImages[0]);
    }
  };

  const handleThumbnailSelect = (imageUrl: string) => {
    if (onThumbnailChange) {
      onThumbnailChange(imageUrl);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        
        <div className="space-y-2">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {uploading ? 'Uploading...' : 'Drop images here or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum {maxImages} images • PNG, JPG, WEBP up to 10MB each
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || images.length >= maxImages}
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
              {/* Thumbnail star icon */}
              {onThumbnailChange && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`absolute top-1 left-1 h-6 w-6 rounded-full p-0 ${
                    thumbnailImage === url 
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                      : 'bg-black/50 text-white hover:bg-black/70'
                  } transition-all`}
                  onClick={() => handleThumbnailSelect(url)}
                >
                  <Star 
                    className={`h-3 w-3 ${thumbnailImage === url ? 'fill-current' : ''}`}
                  />
                </Button>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {/* Thumbnail label */}
              {thumbnailImage === url && (
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="bg-yellow-500 text-white text-xs px-1 py-0.5 rounded text-center font-medium">
                    Thumbnail
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {images.length} of {maxImages} images uploaded
        </p>
      )}
    </div>
  );
};