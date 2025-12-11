import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface SizePattern {
  size: string;
  count: number;
  percentage: number;
}

interface SizePatternChartProps {
  data: SizePattern[];
  isLoading?: boolean;
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];

export const SizePatternChart = ({ data, isLoading = false }: SizePatternChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Sort by standard size order
  const sortedData = [...data].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a.size.toUpperCase());
    const indexB = SIZE_ORDER.indexOf(b.size.toUpperCase());
    if (indexA === -1 && indexB === -1) return a.size.localeCompare(b.size);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const mostPopular = data.reduce((max, item) => item.count > max.count ? item : max, data[0] || { size: '', count: 0 });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Size Selection Patterns</CardTitle>
          {mostPopular && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              Most Popular: {mostPopular.size}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No size data available
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="size" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} orders (${props.payload.percentage}%)`,
                    'Count'
                  ]}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Size breakdown */}
            <div className="space-y-2 mt-4 pt-4 border-t">
              {sortedData.slice(0, 4).map((item) => (
                <div key={item.size} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-10">{item.size}</span>
                  <Progress value={item.percentage} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SizePatternChart;
