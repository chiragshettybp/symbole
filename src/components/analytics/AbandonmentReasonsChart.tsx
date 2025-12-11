import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface AbandonmentReason {
  reason: string;
  count: number;
  percentage: number;
}

interface AbandonmentReasonsChartProps {
  data: AbandonmentReason[];
  isLoading?: boolean;
}

const REASON_LABELS: Record<string, string> = {
  high_shipping: 'High Shipping Cost',
  account_required: 'Account Required',
  payment_options: 'Limited Payment Options',
  price_concerns: 'Price Concerns',
  confusing_ui: 'Confusing UI',
  slow_experience: 'Slow Experience'
};

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export const AbandonmentReasonsChart = ({ data, isLoading = false }: AbandonmentReasonsChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map((item, index) => ({
    ...item,
    name: REASON_LABELS[item.reason] || item.reason,
    value: item.count,
    fill: COLORS[index % COLORS.length]
  }));

  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Cart Abandonment Reasons</CardTitle>
      </CardHeader>
      <CardContent>
        {totalCount === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No abandonment data yet
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={formattedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {formattedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} (${Math.round((value / totalCount) * 100)}%)`,
                    name
                  ]}
                />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle"
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-2 mt-4 pt-4 border-t">
              {formattedData.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AbandonmentReasonsChart;
