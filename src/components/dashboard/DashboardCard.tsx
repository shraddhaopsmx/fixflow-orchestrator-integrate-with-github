
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ArrowUp } from "lucide-react";

type DashboardCardProps = {
  title: string;
  icon: LucideIcon;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
};

const DashboardCard = ({ title, icon: Icon, value, change, changeType }: DashboardCardProps) => {
    const changeColor = changeType === 'increase' ? 'text-red-500' : 'text-green-500';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center">
            <ArrowUp className={`h-4 w-4 mr-1 ${changeColor} ${changeType === 'decrease' && 'transform rotate-180'}`} />
            {change}
        </p>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
