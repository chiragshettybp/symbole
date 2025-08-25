import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Upload, Plus, Loader2 } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';

interface PaymentManagementProps {
  orderId: string;
  onPaymentAdded: () => void;
}

export const PaymentManagement = ({ orderId, onPaymentAdded }: PaymentManagementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logActivity } = useAdmin();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPEG, PNG, or PDF file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const uploadPaymentSlip = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment_slips')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment_slips')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!amount.trim() || !paymentMode) {
      toast({
        title: "Missing Information",
        description: "Please enter amount and payment mode",
        variant: "destructive",
      });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let slipUrl = null;
      
      // Upload file if provided
      if (file) {
        slipUrl = await uploadPaymentSlip(file);
        if (!slipUrl) {
          throw new Error('Failed to upload payment slip');
        }
      }

      // Create payment/refund record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount: numericAmount,
          method: paymentMode,
          status: paymentStatus,
          slip_url: slipUrl,
        });

      if (paymentError) throw paymentError;

      // If this is a refund, also create entry in refunds table for analytics
      if (paymentStatus === 'refund') {
        const { error: refundError } = await supabase
          .from('refunds')
          .insert({
            order_id: orderId,
            amount: numericAmount,
            status: 'completed',
            reason: `Refund processed via ${paymentMode}`,
          });

        if (refundError) {
          console.error('Error creating refund record:', refundError);
          // Continue anyway as payment was already recorded
        }
      }

      // Log activity
      await logActivity(
        'payment',
        orderId,
        'create',
        `${paymentStatus === 'refund' ? 'Refund' : 'Payment'} of ₹${numericAmount} added via ${paymentMode}`,
        null,
        { amount: numericAmount, method: paymentMode, type: paymentStatus, hasSlip: !!slipUrl }
      );

      toast({
        title: `${paymentStatus === 'refund' ? 'Refund' : 'Payment'} Added`,
        description: `${paymentStatus === 'refund' ? 'Refund' : 'Payment'} of ₹${numericAmount} has been recorded`,
      });

      // Reset form
      setAmount('');
      setPaymentMode('');
      setPaymentStatus('paid');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsOpen(false);
      
      // Trigger update in parent
      onPaymentAdded();

    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error",
        description: "Failed to add payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby="payment-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment
          </DialogTitle>
          <p id="payment-dialog-description" className="text-sm text-muted-foreground">
            Record a payment for this order and optionally upload a payment slip.
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Payment Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          
          <div>
            <Label htmlFor="paymentMode">Payment Mode</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cod">Cash on Delivery</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="paymentStatus">Payment Status</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="paymentSlip">Payment Slip (Optional)</Label>
            <div className="mt-1">
              <Input
                id="paymentSlip"
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/jpg,application/pdf"
              />
              {file && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount.trim() || !paymentMode}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};