import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, ArrowRight, CreditCard, Truck } from 'lucide-react';
import Layout from '@/components/layout/Layout';
interface CheckoutFormData {
  firstName: string;
  phoneNumber: string;
  email: string;
  instagramUsername: string;
  streetName: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}
declare global {
  interface Window {
    Razorpay: any;
  }
}
const Checkout = () => {
  const {
    items,
    getSubTotal,
    getCartTotal,
    clearCart
  } = useCart();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'prepaid'>('cod');
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    phoneNumber: '+91 ',
    email: '',
    instagramUsername: '',
    streetName: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);
  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    if (field === 'phoneNumber') {
      // Ensure +91 prefix is always present
      if (!value.startsWith('+91 ')) {
        value = '+91 ' + value.replace(/^\+91\s*/, '');
      }
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const validateForm = (): boolean => {
    const requiredFields = ['firstName', 'phoneNumber', 'email', 'streetName', 'city', 'state', 'pincode'];
    for (const field of requiredFields) {
      if (!formData[field as keyof CheckoutFormData].trim()) {
        toast({
          title: "Missing Information",
          description: `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
          variant: "destructive"
        });
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return false;
    }

    // Phone validation for Indian numbers
    const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
    if (!phoneDigits.startsWith('91') || phoneDigits.length !== 12) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Indian phone number with +91 prefix.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };
  const createOrder = async (paymentStatus: string = 'pending') => {
    const checkoutInitiatedAt = new Date().toISOString();
    const checkoutCompletedAt = new Date().toISOString();
    const orderData = {
      customer_name: formData.firstName,
      customer_email: formData.email,
      customer_phone: formData.phoneNumber,
      address_line1: formData.streetName,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      country: formData.country,
      shipping_address: {
        street: formData.streetName,
        city: formData.city,
        state: formData.state,
        zipCode: formData.pincode,
        country: formData.country
      },
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: item.product?.name,
        brand: item.product?.brand,
        price: item.product?.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.product?.images[0]
      })),
      subtotal: getSubTotal(),
      tax: 0,
      shipping_cost: paymentMethod === 'cod' ? 49 : 0,
      total: getCartTotal(paymentMethod),
      payment_method: paymentMethod,
      status: paymentStatus === 'paid' ? 'paid' : 'pending',
      checkout_initiated_at: checkoutInitiatedAt,
      checkout_completed_at: checkoutCompletedAt,
      instagram_username: formData.instagramUsername || null,
      order_number: ''
    };
    const {
      data: order,
      error
    } = await supabase.from('orders').insert(orderData).select().single();
    if (error) throw error;
    return order;
  };
  const handleRazorpayPayment = async () => {
    if (!validateForm()) return;
    setIsPlacingOrder(true);
    try {
      const totalAmount = Math.round(getCartTotal('prepaid') * 100); // Convert to paise

      const options = {
        key: 'rzp_live_RpOxAXNArV8M8q',
        amount: totalAmount,
        currency: 'INR',
        name: 'Ordify',
        description: 'Order Payment',
        handler: async function (response: any) {
          try {
            // Create order after successful payment
            const order = await createOrder('paid');

            // Create payment record
            await supabase.from('payments').insert({
              order_id: order.id,
              amount: getCartTotal('prepaid'),
              method: 'razorpay',
              status: 'Paid',
              txn_ref: response.razorpay_payment_id
            });
            await clearCart();
            toast({
              title: "Payment Successful! 🎉",
              description: `Order ${order.order_number} has been confirmed.`
            });
            navigate(`/order-confirmation/${order.id}`, {
              state: {
                orderNumber: order.order_number
              }
            });
          } catch (error) {
            console.error('Order creation failed:', error);
            toast({
              title: "Order Failed",
              description: "Payment was successful but order creation failed. Please contact support.",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: formData.firstName,
          email: formData.email,
          contact: formData.phoneNumber.replace('+91 ', '')
        },
        theme: {
          color: '#000000'
        },
        modal: {
          ondismiss: function () {
            setIsPlacingOrder(false);
          }
        }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initialization failed:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
      setIsPlacingOrder(false);
    }
  };
  const handleCODOrder = async () => {
    if (!validateForm()) return;
    setIsPlacingOrder(true);
    try {
      const order = await createOrder('pending');
      await clearCart();
      toast({
        title: "Order Placed Successfully! 🎉",
        description: `Order ${order.order_number} has been confirmed. Pay on delivery.`
      });
      navigate(`/order-confirmation/${order.id}`, {
        state: {
          orderNumber: order.order_number
        }
      });
    } catch (error) {
      console.error('Order placement failed:', error);
      toast({
        title: "Order Failed",
        description: "Failed to place your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };
  const handlePlaceOrder = async () => {
    if (paymentMethod === 'prepaid') {
      await handleRazorpayPayment();
    } else {
      await handleCODOrder();
    }
  };

  // Redirect empty cart
  if (items.length === 0) {
    return <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Cart is Empty</h2>
            <p className="text-muted-foreground">Add some items to your cart first.</p>
            <Button onClick={() => navigate('/')} className="btn-primary">
              Start Shopping
            </Button>
          </div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 md:mb-8 text-center tracking-wide">CHECKOUT</h1>

            <form onSubmit={e => {
            e.preventDefault();
            handlePlaceOrder();
          }} className="space-y-5 sm:space-y-6 md:space-y-8">
              {/* Name Section */}
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Name</h2>
                
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-xs sm:text-sm text-muted-foreground font-medium">
                    First name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="firstName" type="text" value={formData.firstName} onChange={e => handleInputChange('firstName', e.target.value)} className="bg-card border-border text-foreground rounded-lg h-11 sm:h-12 px-3 sm:px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base" placeholder="First name" required />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phoneNumber" className="text-xs sm:text-sm text-muted-foreground font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={e => handleInputChange('phoneNumber', e.target.value)} className="bg-card border-border text-foreground rounded-lg h-11 sm:h-12 px-3 sm:px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base" placeholder="+91 Phone Number" required />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs sm:text-sm text-muted-foreground font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className="bg-card border-border text-foreground rounded-lg h-11 sm:h-12 px-3 sm:px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base" placeholder="Email" required />
                </div>

                
              </div>

              {/* Address Section */}
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Address</h2>
                
                <div className="space-y-1">
                  <Label htmlFor="streetName" className="text-xs sm:text-sm text-muted-foreground font-medium">
                    Street name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="streetName" type="text" value={formData.streetName} onChange={e => handleInputChange('streetName', e.target.value)} className="bg-card border-border text-foreground rounded-lg h-11 sm:h-12 px-3 sm:px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base" placeholder="Street name" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-xs sm:text-sm text-muted-foreground font-medium">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input id="city" type="text" value={formData.city} onChange={e => handleInputChange('city', e.target.value)} className="bg-card border-border text-foreground rounded-lg h-11 sm:h-12 px-3 sm:px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base" placeholder="City" required />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-xs sm:text-sm text-muted-foreground font-medium">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Input id="state" type="text" value={formData.state} onChange={e => handleInputChange('state', e.target.value)} className="bg-card border-border text-foreground rounded-lg h-11 sm:h-12 px-3 sm:px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base" placeholder="State" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="pincode" className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Pincode <span className="text-red-500">*</span>
                    </Label>
                    <Input id="pincode" type="text" value={formData.pincode} onChange={e => handleInputChange('pincode', e.target.value)} className="bg-card border-border text-foreground rounded-lg h-11 sm:h-12 px-3 sm:px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base" placeholder="Pincode" required />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="country" className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.country} onValueChange={value => handleInputChange('country', value)}>
                      <SelectTrigger className="bg-card border-border text-foreground rounded-lg h-11 sm:h-12 px-3 sm:px-4 focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="India">India</SelectItem>
                        <SelectItem value="USA">USA</SelectItem>
                        <SelectItem value="UK">UK</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Payment Method</h2>
                
                <RadioGroup value={paymentMethod} onValueChange={value => setPaymentMethod(value as 'cod' | 'prepaid')} className="space-y-3">
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground text-sm sm:text-base">Cash on Delivery (COD)</p>
                        <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                      </div>
                    </Label>
                  </div>

                  <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'prepaid' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value="prepaid" id="prepaid" />
                    <Label htmlFor="prepaid" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground text-sm sm:text-base">Prepaid (Razorpay)</p>
                        <p className="text-xs text-muted-foreground">Pay now via UPI, Cards, Net Banking</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Order Summary */}
              <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₹{getSubTotal().toFixed(2)}</span>
                </div>
                {paymentMethod === 'cod' && <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">COD Charges</span>
                    <span className="text-foreground">₹49.00</span>
                  </div>}
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">₹{getCartTotal(paymentMethod).toFixed(2)}</span>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="text-xs sm:text-sm text-muted-foreground">
                <span className="text-primary">We respect your privacy</span>, your information will remain safe and secure.
              </div>

              {/* Place Order Button */}
              <Button type="submit" disabled={isPlacingOrder} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 sm:py-4 rounded-lg text-sm sm:text-lg tracking-wide transition-all duration-300 flex items-center justify-center gap-2 min-h-[48px]">
                {isPlacingOrder ? <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    {paymentMethod === 'prepaid' ? 'Processing Payment...' : 'Placing Order...'}
                  </> : <>
                    {paymentMethod === 'prepaid' ? 'PAY NOW' : 'PLACE ORDER'}
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </>}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>;
};
export default Checkout;