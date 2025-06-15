import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Loader2, FileCode } from "lucide-react";
import { codeTestCases } from '@/lib/code-test-data';
import { CodeFinding } from '@/types/code';
import { Badge } from '@/components/ui/badge';
import { runAutoFixWorkflow } from '@/lib/autofix-workflow';
import { AutoFixResult, IssueMetadata } from '@/types/workflow';
import AutoFixResultDisplay from './AutoFixResultDisplay';

const WorkflowAuditLog = ({ log }: { log: AutoFixResult['auditLog'] }) => (
  <div className="space-y-4 font-mono text-xs bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
    {log.map((entry, index) => (
      <div key={index}>
        <p className="text-muted-foreground">{entry.timestamp}</p>
        <p><span className="font-semibold">[{entry.actor}]</span> - {entry.action}</p>
        <pre className="mt-1 p-2 bg-background rounded-md overflow-x-auto">
          {JSON.stringify(entry.details, null, 2)}
        </pre>
      </div>
    ))}
  </div>
);

const CodeRemediationAgent = () => {
  const [selectedFinding, setSelectedFinding] = useState<CodeFinding | null>(null);
  const [autoFixResult, setAutoFixResult] = useState<AutoFixResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectFinding = (findingId: string) => {
    const finding = codeTestCases.find(c => c.findingId === findingId) || null;
    setSelectedFinding(finding);
    setAutoFixResult(null);
  };

  const handleGenerateFix = async () => {
    if (!selectedFinding) return;
    setIsLoading(true);
    setAutoFixResult(null);
    
    const issue: IssueMetadata = {
        id: selectedFinding.findingId,
        type: 'SCA',
        severity: selectedFinding.vulnerability.severity,
        location: {
            filePath: selectedFinding.filePath,
            repository: 'github.com/example/monitored-app',
            branch: 'main',
        },
        description: `${selectedFinding.vulnerability.name} (${selectedFinding.vulnerability.id})`,
    };

    const result = await runAutoFixWorkflow(issue);
    setAutoFixResult(result);
    setIsLoading(false);
  };

  const getSeverityColor = (severity: 'Critical' | 'High' | 'Medium' | 'Low') => {
    switch (severity) {
      case 'Critical': return 'bg-red-600';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-6 w-6" /> Code Remediation Agent
        </CardTitle>
        <CardDescription>
          Select a SAST/SCA finding to generate an automated pull request with the suggested fix.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Select onValueChange={handleSelectFinding} value={selectedFinding?.findingId || ''}>
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="Select a code finding..." />
            </SelectTrigger>
            <SelectContent>
              {codeTestCases.map((testCase) => (
                <SelectItem key={testCase.findingId} value={testCase.findingId}>
                  {testCase.vulnerability.name} ({testCase.language})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateFix} disabled={!selectedFinding || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bot className="h-4 w-4 mr-2" />
            )}
            Generate Fix
          </Button>
        </div>

        {selectedFinding && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">{selectedFinding.vulnerability.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="destructive" className={`${getSeverityColor(selectedFinding.vulnerability.severity)} text-white`}>{selectedFinding.vulnerability.severity}</Badge>
                <span>ID: {selectedFinding.vulnerability.id}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm bg-background p-2 rounded">
                {selectedFinding.filePath}:{selectedFinding.startLine}
              </p>
              <pre className="mt-2 bg-background p-4 rounded-md overflow-x-auto">
                <code className={`language-${selectedFinding.language.toLowerCase()}`}>{selectedFinding.snippet}</code>
              </pre>
            </CardContent>
          </Card>
        )}

        <AutoFixResultDisplay autoFixResult={autoFixResult} />

      </CardContent>
    </Card>
  );
};

export default CodeRemediationAgent;
