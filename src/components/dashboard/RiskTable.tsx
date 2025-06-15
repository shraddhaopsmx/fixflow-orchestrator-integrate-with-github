
import { Risk } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type RiskTableProps = {
  risks: Risk[];
};

const severityColors: Record<Risk['severity'], string> = {
    Critical: "bg-red-500/20 text-red-400 border-red-500/30",
    High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
}

const statusColors: Record<Risk['status'], string> = {
    Open: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    "In Progress": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Fixed: "bg-green-500/20 text-green-400 border-green-500/30",
}

const RiskTable = ({ risks }: RiskTableProps) => {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Risk</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Detected</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {risks.map((risk) => (
            <TableRow key={risk.id}>
              <TableCell>
                <div className="font-medium">{risk.title}</div>
                <div className="text-sm text-muted-foreground">{risk.resource}</div>
              </TableCell>
              <TableCell>{risk.agent}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize", severityColors[risk.severity])}>
                    {risk.severity}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn(statusColors[risk.status])}>
                    {risk.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDistanceToNow(new Date(risk.timestamp), { addSuffix: true })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RiskTable;
