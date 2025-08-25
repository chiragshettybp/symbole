import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Search, Filter, Plus, Download, Eye, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { PaymentSlipViewer } from '@/components/admin/PaymentSlipViewer';

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  status: string;
  txn_ref?: string;
  slip_url?: string;
  created_at: string;
  orders: {
    order_number: string;
    customer_name: string;
  };
}

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showSlipViewer, setShowSlipViewer] = useState(false);
  const [selectedSlipUrl, setSelectedSlipUrl] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const navigate = useNavigate();
  const { logActivity } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchPayments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, methodFilter]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          orders (
            order_number,
            customer_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.orders?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.orders?.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.txn_ref?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.method === methodFilter);
    }

    setFilteredPayments(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", className?: string } } = {
      'paid': { variant: 'default', className: 'bg-green-100 text-green-800' },
      'refund': { variant: 'destructive', className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status] || { variant: 'outline' };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const csvData = filteredPayments.map(payment => ({
      payment_id: payment.id,
      order_number: payment.orders?.order_number,
      customer: payment.orders?.customer_name,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      txn_ref: payment.txn_ref || '',
      created_at: new Date(payment.created_at).toLocaleDateString(),
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    logActivity('export', null, 'payments_csv_export', `Exported ${csvData.length} payments to CSV`);
  };

  const viewPaymentSlip = (slipUrl: string, paymentId: string) => {
    setSelectedSlipUrl(slipUrl);
    setSelectedPaymentId(paymentId);
    setShowSlipViewer(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Payment Management</h1>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/admin/payments/new')} size="sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Payment</span>
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button onClick={fetchPayments} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cod">COD</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payment Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₹{filteredPayments
                  .filter(p => p.status === 'paid')
                  .reduce((sum, payment) => sum + Number(payment.amount), 0)
                  .toLocaleString('en-IN', { maximumFractionDigits: 0 })
                }
              </div>
              <p className="text-xs text-muted-foreground">from paid payments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{filteredPayments
                  .filter(p => p.status === 'paid')
                  .reduce((sum, payment) => sum + Number(payment.amount), 0)
                  .toLocaleString('en-IN', { maximumFractionDigits: 0 })
                }
              </div>
              <p className="text-xs text-muted-foreground">successfully paid amount</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Refund</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹{filteredPayments
                  .filter(p => p.status === 'refund')
                  .reduce((sum, payment) => sum + Number(payment.amount), 0)
                  .toLocaleString('en-IN', { maximumFractionDigits: 0 })
                }
              </div>
              <p className="text-xs text-muted-foreground">total refunded amount</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {filteredPayments.length}
              </div>
              <p className="text-xs text-muted-foreground">total payment records</p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payments ({filteredPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction Ref</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium font-mono text-sm">
                        {payment.id.slice(0, 8)}...
                      </TableCell>
                      
                      <TableCell className="font-medium">
                        {payment.orders?.order_number}
                      </TableCell>
                      
                      <TableCell>
                        {payment.orders?.customer_name}
                      </TableCell>
                      
                      <TableCell className="font-medium">
                        ₹{Number(payment.amount).toFixed(2)}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {payment.method.toUpperCase()}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      
                      <TableCell className="font-mono text-sm">
                        {payment.txn_ref || '-'}
                      </TableCell>
                      
                      <TableCell className="text-sm">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/payments/${payment.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payment.slip_url && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewPaymentSlip(payment.slip_url!, payment.id)}
                                title="View Payment Slip"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(payment.slip_url, '_blank')}
                                title="Download Payment Slip"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">
                        {payment.orders?.order_number}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payment.orders?.customer_name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        ID: {payment.id.slice(0, 8)}...
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">₹{Number(payment.amount).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {payment.method.toUpperCase()}
                    </Badge>
                    {getStatusBadge(payment.status)}
                    {payment.txn_ref && (
                      <Badge variant="secondary" className="text-xs">
                        {payment.txn_ref}
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/payments/${payment.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {payment.slip_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewPaymentSlip(payment.slip_url!, payment.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Slip
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredPayments.length === 0 && (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No payments found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Slip Viewer */}
        {showSlipViewer && (
          <PaymentSlipViewer
            slipUrl={selectedSlipUrl}
            paymentId={selectedPaymentId}
            isOpen={showSlipViewer}
            onClose={() => setShowSlipViewer(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;