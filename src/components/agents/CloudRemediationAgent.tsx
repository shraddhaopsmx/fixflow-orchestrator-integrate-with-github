
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cloudTestCases } from '@/lib/cloud-test-data';
import { cloudRemediationService } from '@/lib/cloud-remediation-service';
import { CSPMFinding, RemediationPlan } from '@/types/cloud';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from '../ui/badge';

const CodeBlock = ({ code, lang }: { code: string, lang: string }) => (
  <pre className="bg-gray-900 text-white font-mono text-sm rounded-md p-4 overflow-x-auto">
    <code>{code.trim()}</code>
  </pre>
);

const CloudRemediationAgent = () => {
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [remediationPlan, setRemediationPlan] = useState<RemediationPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedFinding = cloudTestCases.find(f => f.findingId === selectedFindingId);

  const handleRemediate = async () => {
    if (!selectedFinding) return;

    setIsLoading(true);
    setRemediationPlan(null);
    toast.info("Generating remediation plan...");
    
    try {
      const plan = await cloudRemediationService.remediate(selectedFinding);
      setRemediationPlan(plan);
      if (plan.success) {
        toast.success("Remediation plan generated successfully!");
      } else {
        toast.error(`Failed to generate plan: ${plan.error}`);
      }
    } catch (e) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSeverityBadge = (severity: 'Critical' | 'High' | 'Medium' | 'Low') => {
    switch(severity) {
      case 'Critical': return 'bg-red-600';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-blue-500';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cloud Remediation Agent (AWS)</CardTitle>
        <CardDescription>Select a simulated CSPM finding to generate a remediation plan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Select onValueChange={setSelectedFindingId} value={selectedFindingId || ''}>
            <SelectTrigger className="w-[350px]">
              <SelectValue placeholder="Select a test finding..." />
            </SelectTrigger>
            <SelectContent>
              {cloudTestCases.map((finding) => (
                <SelectItem key={finding.findingId} value={finding.findingId}>
                  {finding.findingId}: {finding.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRemediate} disabled={!selectedFindingId || isLoading}>
            {isLoading ? "Generating..." : "Generate Remediation Plan"}
          </Button>
        </div>

        {selectedFinding && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Finding Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>ID:</strong> {selectedFinding.findingId}</p>
                <p><strong>Resource:</strong> {selectedFinding.resourceId} ({selectedFinding.resourceType})</p>
                <p><strong>Description:</strong> {selectedFinding.description}</p>
                <p><strong>Severity:</strong> <Badge className={`${getSeverityBadge(selectedFinding.severity)} text-white`}>{selectedFinding.severity}</Badge></p>
              </div>
            </CardContent>
          </Card>
        )}

        {remediationPlan && (
          <div className="space-y-4">
            <Alert variant={remediationPlan.success ? "default" : "destructive"}>
              <Terminal className="h-4 w-4" />
              <AlertTitle>{remediationPlan.success ? "Plan Generated" : "Error"}</AlertTitle>
              <AlertDescription>
                {remediationPlan.explanation}
              </AlertDescription>
            </Alert>
            
            {remediationPlan.success && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Fix ({remediationPlan.remediation.type})</h3>
                  <p className="text-sm text-muted-foreground mb-2">{remediationPlan.remediation.description}</p>
                  <CodeBlock code={remediationPlan.remediation.code} lang={remediationPlan.remediation.type.toLowerCase()} />
                </div>
                {remediationPlan.rollback && (
                  <div>
                    <h3 className="font-semibold mb-2">Rollback ({remediationPlan.rollback.type})</h3>
                    <p className="text-sm text-muted-foreground mb-2">{remediationPlan.rollback.description}</p>
                    <CodeBlock code={remediationPlan.rollback.code} lang={remediationPlan.rollback.type.toLowerCase()} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CloudRemediationAgent;
