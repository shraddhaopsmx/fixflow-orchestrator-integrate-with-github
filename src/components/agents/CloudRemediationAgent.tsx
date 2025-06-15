import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cloudTestCases } from '@/lib/cloud-test-data';
import { toast } from "sonner";
import { Badge } from '../ui/badge';
import { Bot, Loader2 } from 'lucide-react';
import { runAutoFixWorkflow } from '@/lib/autofix-workflow';
import { AutoFixResult, IssueMetadata } from '@/types/workflow';
import AutoFixResultDisplay from './AutoFixResultDisplay';

const CodeBlock = ({ code, lang }: { code: string, lang: string }) => (
  <pre className="bg-gray-900 text-white font-mono text-sm rounded-md p-4 overflow-x-auto">
    <code>{code.trim()}</code>
  </pre>
);

const CloudRemediationAgent = () => {
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [autoFixResult, setAutoFixResult] = useState<AutoFixResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedFinding = cloudTestCases.find(f => f.findingId === selectedFindingId);

  const handleGenerateFix = async () => {
    if (!selectedFinding) return;

    setIsLoading(true);
    setAutoFixResult(null);
    toast.info("Generating remediation plan...");
    
    const issue: IssueMetadata = {
      id: selectedFinding.findingId,
      type: 'CSPM',
      severity: selectedFinding.severity,
      location: {
        resourceId: selectedFinding.resourceId,
        region: selectedFinding.region,
      },
      description: selectedFinding.description,
    };

    try {
      const result = await runAutoFixWorkflow(issue);
      setAutoFixResult(result);
      if (result.status === 'COMPLETED_AUTOMATIC' || result.status === 'AWAITING_APPROVAL') {
        toast.success("Workflow finished successfully!");
      } else {
        toast.error(`Workflow failed: ${result.error}`);
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

  const handleSelectFinding = (findingId: string) => {
    setSelectedFindingId(findingId);
    setAutoFixResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cloud Remediation Agent (AWS)</CardTitle>
        <CardDescription>Select a simulated CSPM finding to generate a remediation plan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Select onValueChange={handleSelectFinding} value={selectedFindingId || ''}>
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
          <Button onClick={handleGenerateFix} disabled={!selectedFindingId || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
            {isLoading ? "Generating..." : "Generate Fix"}
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

        <AutoFixResultDisplay autoFixResult={autoFixResult} />

      </CardContent>
    </Card>
  );
};

export default CloudRemediationAgent;
