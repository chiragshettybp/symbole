import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentSlipViewerProps {
  slipUrl: string;
  paymentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentSlipViewer = ({ slipUrl, paymentId, isOpen, onClose }: PaymentSlipViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const { toast } = useToast();

  const downloadSlip = async () => {
    try {
      const response = await fetch(slipUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-slip-${paymentId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download payment slip",
        variant: "destructive",
      });
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError(true);
  };

  const isPdf = slipUrl.toLowerCase().includes('.pdf');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payment Slip
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadSlip}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {isPdf ? (
            <div className="w-full h-96 bg-muted rounded-lg flex flex-col items-center justify-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">PDF files cannot be previewed</p>
              <Button onClick={downloadSlip}>
                <Download className="h-4 w-4 mr-2" />
                Download to View
              </Button>
            </div>
          ) : (
            <div className="relative">
              {isLoading && (
                <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              {error && (
                <div className="w-full h-96 bg-muted rounded-lg flex flex-col items-center justify-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">Failed to load image</p>
                  <Button onClick={downloadSlip}>
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
              <img
                src={slipUrl}
                alt="Payment Slip"
                className={`max-w-full h-auto rounded-lg ${isLoading ? 'hidden' : ''}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};