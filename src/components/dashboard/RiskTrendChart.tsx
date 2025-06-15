
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { Risk } from '@/types';
import { eachDayOfInterval, subDays, format } from 'date-fns';

type RiskTrendChartProps = {
  risks: Risk[];
};

const RiskTrendChart = ({ risks }: RiskTrendChartProps) => {
    const trendData = eachDayOfInterval({ start: subDays(new Date(), 30), end: new Date() }).map(day => {
        const formattedDate = format(day, 'MMM d');
        const dailyRisks = risks.filter(risk => format(new Date(risk.timestamp), 'MMM d') === formattedDate);
        return {
            date: formattedDate,
            Critical: dailyRisks.filter(r => r.severity === 'Critical').length,
            High: dailyRisks.filter(r => r.severity === 'High').length,
            Medium: dailyRisks.filter(r => r.severity === 'Medium').length,
            Low: dailyRisks.filter(r => r.severity === 'Low').length,
        }
    }).filter(d => d.Critical > 0 || d.High > 0 || d.Medium > 0 || d.Low > 0);


  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Risk Trend</CardTitle>
        <CardDescription>New risks detected over the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                    }}
                />
                <Legend />
                <Line type="monotone" dataKey="Critical" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="High" stroke="#f97316" strokeWidth={2} />
                <Line type="monotone" dataKey="Medium" stroke="#eab308" strokeWidth={2} />
                <Line type="monotone" dataKey="Low" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RiskTrendChart;
