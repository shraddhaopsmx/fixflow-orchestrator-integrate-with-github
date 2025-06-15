
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runtimeAlerts } from '@/lib/runtime-alerts';
import { runAutoFixWorkflow } from '@/lib/autofix-workflow';
import { AutoFixResult, IssueMetadata } from '@/types/workflow';
import AutoFixResultDisplay from './AutoFixResultDisplay';

const RuntimeRemediationAgent = () => {
  const [selectedAlertId, setSelectedAlertId] = useState<string | undefined>(runtimeAlerts[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [autoFixResult, setAutoFixResult] = useState<AutoFixResult | null>(null);

  const { toast } = useToast();

  const selectedAlert = useMemo(
    () => runtimeAlerts.find((a) => a.id === selectedAlertId),
    [selectedAlertId]
  );
  
  useEffect(() => {
    if (selectedAlert) {
      setAutoFixResult(null);
    }
  }, [selectedAlert]);

  const handleGenerateFix = () => {
    if (!selectedAlert) return;

    setIsLoading(true);
    setAutoFixResult(null);
    
    const issue: IssueMetadata = {
        id: selectedAlert.id,
        type: 'RUNTIME',
        severity: 'Critical', // Runtime alerts are typically high severity
        location: {
            resourceId: selectedAlert.affectedResource
        },
        description: selectedAlert.description
    };

    toast({
        title: "Invoking Runtime Workflow",
        description: "Attempting to generate a fix..."
    });

    runAutoFixWorkflow(issue).then(result => {
        setAutoFixResult(result);
        setIsLoading(false);
        if (result.status !== 'FAILED') {
            toast({
              title: "Workflow Complete",
              description: `Result: ${result.decision}`,
            });
        } else {
            toast({
                title: "Workflow Failed",
                description: result.error,
                variant: 'destructive'
            })
        }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            <CardTitle>Runtime Remediation Agent</CardTitle>
          </div>
          <CardDescription>
            Simulate a runtime alert and trigger an automated remediation workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="alert-select" className="text-sm font-medium">Simulated Runtime Alert</label>
            <Select onValueChange={setSelectedAlertId} value={selectedAlertId}>
              <SelectTrigger id="alert-select">
                <SelectValue placeholder="Select an alert to simulate..." />
              </SelectTrigger>
              <SelectContent>
                {runtimeAlerts.map((alert) => (
                  <SelectItem key={alert.id} value={alert.id}>{alert.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleGenerateFix} disabled={isLoading || !selectedAlertId} className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
            {isLoading ? 'Processing...' : 'Generate Fix'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Result</CardTitle>
          <CardDescription>
            Real-time log of the agent's actions and decisions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {autoFixResult ? (
            <AutoFixResultDisplay autoFixResult={autoFixResult} />
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p>Trigger a remediation to see the results here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RuntimeRemediationAgent;
