import React from 'react';
import { PolicyRule } from '@/lib/policy-engine';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PolicyListProps {
  policies: PolicyRule[];
  onEdit: (policy: PolicyRule) => void;
  onDelete: (policyId: string) => void;
}

const PolicyList: React.FC<PolicyListProps> = ({ policies, onEdit, onDelete }) => {

  const renderConditions = (conditions: PolicyRule['conditions']) => {
    const parts: string[] = [];
    if (conditions.severity?.length) {
      parts.push(`Severity: ${conditions.severity.join(', ')}`);
    }
    if (conditions.source?.length) {
      parts.push(`Source: ${conditions.source.join(', ')}`);
    }
    if (parts.length === 0) return <Badge variant="outline">Any Issue</Badge>;
    return parts.join(' AND ');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configured Policies</CardTitle>
        <CardDescription>These policies are evaluated in order from top to bottom.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Policy</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[100px]">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">
                    <div className="font-bold">{policy.name || 'Untitled Policy'}</div>
                    <div className="text-xs text-muted-foreground">{policy.description}</div>
                  </TableCell>
                  <TableCell className="text-sm">{renderConditions(policy.conditions)}</TableCell>
                  <TableCell>
                    <Badge variant={policy.decision.autoRemediate ? 'default' : 'secondary'}>
                      {policy.decision.autoRemediate ? 'Auto-Remediate' : 'Manual Approval'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={policy.enabled ? 'outline' : 'destructive'} className={policy.enabled ? 'text-green-600 border-green-600' : ''}>
                      {policy.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(policy)}>
                          <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(policy.id)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PolicyList;
