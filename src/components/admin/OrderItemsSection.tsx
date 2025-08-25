import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

interface OrderItem {
  size: string;
  brand: string;
  color: string;
  image: string;
  price: number;
  quantity: number;
  product_id: string;
  product_name: string;
}

interface OrderItemsSectionProps {
  orderId: string;
  items: OrderItem[];
}

export const OrderItemsSection = ({ orderId, items }: OrderItemsSectionProps) => {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4" />
            <p>No items found for this order</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order Items ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={`${item.product_id}-${item.size}-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.product_name}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">ID: {item.product_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.brand}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.size}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.color}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{item.quantity}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{Number(item.price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {items.map((item, index) => (
            <div key={`${item.product_id}-${item.size}-${index}`} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.product_name}
                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.product_name}</h4>
                  <p className="text-xs text-muted-foreground">ID: {item.product_id}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-medium text-sm">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">{item.brand}</Badge>
                <Badge variant="outline" className="text-xs">{item.size}</Badge>
                <Badge variant="secondary" className="text-xs">{item.color}</Badge>
                <Badge variant="secondary" className="text-xs">Qty: {item.quantity}</Badge>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unit Price:</span>
                <span>₹{Number(item.price).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};