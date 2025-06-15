
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, ShieldCheck, ShieldAlert, Bot, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runtimeAlerts } from '@/lib/runtime-alerts';
import { RemediationResult } from '@/types/runtime';

const TRUST_THRESHOLD = 80; // Corresponds to 20% uncertainty

const RuntimeRemediationAgent = () => {
  const [selectedAlertId, setSelectedAlertId] = useState<string | undefined>(runtimeAlerts[0].id);
  const [confidence, setConfidence] = useState<number[]>([runtimeAlerts[0].defaultConfidence]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RemediationResult | null>(null);

  const { toast } = useToast();

  const selectedAlert = useMemo(
    () => runtimeAlerts.find((a) => a.id === selectedAlertId),
    [selectedAlertId]
  );
  
  useEffect(() => {
    if (selectedAlert) {
      setConfidence([selectedAlert.defaultConfidence]);
      setResult(null);
    }
  }, [selectedAlert]);

  const handleTrigger = () => {
    if (!selectedAlert) return;

    setIsLoading(true);
    setResult(null);
    
    // Simulate processing time
    setTimeout(() => {
      const currentConfidence = confidence[0];
      const log: string[] = [
        `[${new Date().toISOString()}] Received alert: "${selectedAlert.description}"`,
        `[${new Date().toISOString()}] Alert confidence assessed at ${currentConfidence}%.`,
      ];
      
      let newResult: RemediationResult;

      if (currentConfidence >= TRUST_THRESHOLD) {
        // Auto-remediate
        const actionTaken = selectedAlert.suggestedAction;
        log.push(`[${new Date().toISOString()}] Confidence >= ${TRUST_THRESHOLD}%. Executing automated action: ${actionTaken}.`);
        log.push(`[${new Date().toISOString()}] Simulating action...`);
        log.push(`[${new Date().toISOString()}] Action successful.`);
        log.push(`[${new Date().toISOString()}] Alerting human via webhook to Slack channel #security-alerts.`);

        newResult = {
          actionTaken,
          details: `Automated action taken: ${actionTaken}. Target details inferred from alert.`,
          notificationSent: true,
          log,
        };
        
        toast({
          title: "Action Taken",
          description: `Successfully executed: ${actionTaken}`,
        });

      } else {
        // Escalate
        log.push(`[${new Date().toISOString()}] Confidence < ${TRUST_THRESHOLD}%. Escalating for human review.`);
        log.push(`[${new Date().toISOString()}] No automated action taken.`);
        log.push(`[${new Date().toISOString()}] Alerting on-call team via PagerDuty.`);
        
        newResult = {
          actionTaken: 'ESCALATED',
          details: 'Action escalated for human review due to low confidence score.',
          notificationSent: true,
          log,
        };
        
        toast({
          title: "Escalated for Review",
          description: "Confidence was below the trust threshold.",
          variant: "destructive",
        });
      }

      setResult(newResult);
      setIsLoading(false);
    }, 1500);
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
            Simulate a runtime alert and trigger a compensating action. This agent is off by default for safety.
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
          
          <div className="space-y-2">
            <label htmlFor="confidence-slider" className="text-sm font-medium">
              Alert Confidence ({confidence[0]}%)
            </label>
            <p className="text-xs text-muted-foreground">
              Adjust the confidence score of the alert. Actions are auto-triggered if confidence is ≥ {TRUST_THRESHOLD}%.
            </p>
            <Slider
              id="confidence-slider"
              min={0}
              max={100}
              step={1}
              value={confidence}
              onValueChange={setConfidence}
              disabled={isLoading}
            />
          </div>

          <Button onClick={handleTrigger} disabled={isLoading || !selectedAlertId} className="w-full">
            {isLoading ? 'Processing...' : 'Trigger Remediation'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Remediation Log</CardTitle>
          <CardDescription>
            Real-time log of the agent's actions and decisions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <Alert variant={result.actionTaken === 'ESCALATED' ? 'destructive' : 'default'}>
                {result.actionTaken === 'ESCALATED' ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                <AlertTitle>
                  {result.actionTaken === 'ESCALATED' ? 'Escalated for Human Review' : `Action Completed: ${result.actionTaken}`}
                </AlertTitle>
                <AlertDescription>
                  {result.details}
                  {result.notificationSent && (
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <Bell className="h-3 w-3" />
                      <span>Notification sent.</span>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
              <div className="bg-muted rounded-md p-4 font-mono text-xs max-h-60 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="h-4 w-4" />
                  <span>Action Log</span>
                </div>
                {result.log.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
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
