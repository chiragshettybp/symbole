import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

interface FunnelStep {
  step: string;
  users: number;
  dropOff: number;
  conversionRate: number;
}

interface CheckoutFunnelChartProps {
  data: FunnelStep[];
  isLoading?: boolean;
}

const STEP_LABELS: Record<string, string> = {
  homepage: 'Homepage',
  product: 'Product Page',
  cart: 'Cart',
  shipping: 'Shipping',
  payment: 'Payment',
  review: 'Review',
  complete: 'Complete'
};

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#10b981'];

export const CheckoutFunnelChart = ({ data, isLoading = false }: CheckoutFunnelChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map((item, index) => ({
    ...item,
    name: STEP_LABELS[item.step] || item.step,
    fill: COLORS[index % COLORS.length],
    value: item.users
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Checkout Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={formattedData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fontSize: 12 }}
              width={75}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value} users (${props.payload.conversionRate}% conversion)`,
                'Users'
              ]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Funnel Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{data[0]?.users || 0}</p>
            <p className="text-xs text-muted-foreground">Started</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{data[data.length - 1]?.users || 0}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {data[0]?.users ? Math.round((data[data.length - 1]?.users / data[0]?.users) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Overall Conv.</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">
              {data[0]?.users ? data[0]?.users - (data[data.length - 1]?.users || 0) : 0}
            </p>
            <p className="text-xs text-muted-foreground">Total Drop-off</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutFunnelChart;
