import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Download, Eye, Loader2, Trash2 } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  slip_url?: string;
  txn_ref?: string;
  created_at: string;
}

interface PaymentHistoryProps {
  orderId: string;
  refreshTrigger: number;
  orderTotal: number;
}

export const PaymentHistory = ({ orderId, refreshTrigger, orderTotal }: PaymentHistoryProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `order_id=eq.${orderId}`
        },
        () => fetchPayments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, refreshTrigger]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePayment = async (paymentId: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      await logActivity(
        'payment',
        orderId,
        'delete',
        `Payment of ₹${amount} deleted`,
        null,
        { paymentId, amount }
      );

      toast({
        title: "Payment Deleted",
        description: "Payment record has been removed",
      });

      fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive",
      });
    }
  };

  const viewPaymentSlip = (slipUrl: string) => {
    try {
      // Check if URL is from Supabase storage
      if (slipUrl.includes('supabase.co/storage')) {
        window.open(slipUrl, '_blank');
      } else {
        // For relative URLs, construct full URL
        const fullUrl = slipUrl.startsWith('/') ? `${window.location.origin}${slipUrl}` : slipUrl;
        window.open(fullUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening payment slip:', error);
      toast({
        title: "Error",
        description: "Failed to open payment slip",
        variant: "destructive",
      });
    }
  };

  const downloadPaymentSlip = async (slipUrl: string, paymentId: string) => {
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

  const getStatusBadge = (status: string) => {
    const config = {
      'paid': { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      'completed': { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      'refund': { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      'pending': { variant: 'secondary' as const, className: '' },
      'failed': { variant: 'destructive' as const, className: '' },
    };
    
    const statusConfig = config[status as keyof typeof config] || { variant: 'outline' as const, className: '' };
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const methodNames = {
      'bank_transfer': 'Bank Transfer',
      'upi': 'UPI',
      'cash': 'Cash',
      'card': 'Card',
      'cod': 'COD',
      'other': 'Other'
    };
    
    return (
      <Badge variant="outline">
        {methodNames[method as keyof typeof methodNames] || method.toUpperCase()}
      </Badge>
    );
  };

  // Calculate actual amounts considering refunds as negative
  const getActualAmount = (payment: Payment) => {
    const amount = Number(payment.amount);
    return payment.status === 'refund' ? -amount : amount;
  };

  // Calculate total paid (payments minus refunds)
  const totalPaid = payments
    .filter(p => ['completed', 'paid'].includes(p.status))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalRefunded = payments
    .filter(p => p.status === 'refund')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const netPayment = totalPaid - totalRefunded;
  const remainingAmount = orderTotal - netPayment;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History ({payments.length})
          </div>
          <div className="hidden md:block text-right space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-lg font-bold text-green-600">₹{totalPaid.toFixed(2)}</p>
            </div>
            {totalRefunded > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Total Refunded</p>
                <p className="text-lg font-bold text-red-600">₹{totalRefunded.toFixed(2)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Net Payment</p>
              <p className="text-lg font-bold text-blue-600">₹{netPayment.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-lg font-bold ${remainingAmount <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                ₹{remainingAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </CardTitle>
        
        {/* Mobile Payment Summary */}
        <div className="md:hidden mt-4 grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
            <p className="text-base font-bold text-green-600">₹{totalPaid.toFixed(2)}</p>
          </div>
          {totalRefunded > 0 && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Refunded</p>
              <p className="text-base font-bold text-red-600">₹{totalRefunded.toFixed(2)}</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Net Payment</p>
            <p className="text-base font-bold text-blue-600">₹{netPayment.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className={`text-base font-bold ${remainingAmount <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
              ₹{remainingAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4" />
            <p>No payments recorded yet</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Slip</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.created_at).toLocaleDateString()} <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(payment.created_at).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${payment.status === 'refund' ? 'text-red-600' : 'text-green-600'}`}>
                          {payment.status === 'refund' ? '-' : '+'}₹{Number(payment.amount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getMethodBadge(payment.method)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell>
                        {payment.slip_url ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewPaymentSlip(payment.slip_url!)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadPaymentSlip(payment.slip_url!, payment.id)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No slip</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this payment of ₹{Number(payment.amount).toFixed(2)}? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePayment(payment.id, Number(payment.amount))}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Payment
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="bg-card border rounded-xl p-4 space-y-3 shadow-sm">
                  {/* Header with date and amount */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">
                        {new Date(payment.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${payment.status === 'refund' ? 'text-red-500' : 'text-green-500'}`}>
                        {payment.status === 'refund' ? '-' : '+'}₹{Number(payment.amount).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {getMethodBadge(payment.method)}
                    {getStatusBadge(payment.status)}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex gap-2">
                      {payment.slip_url ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewPaymentSlip(payment.slip_url!)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Slip
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadPaymentSlip(payment.slip_url!, payment.id)}
                            className="text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm py-2">No slip uploaded</span>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {payment.status === 'refund' ? 'Refund' : 'Payment'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this {payment.status === 'refund' ? 'refund' : 'payment'} of ₹{Number(payment.amount).toFixed(2)}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePayment(payment.id, Number(payment.amount))}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete {payment.status === 'refund' ? 'Refund' : 'Payment'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};