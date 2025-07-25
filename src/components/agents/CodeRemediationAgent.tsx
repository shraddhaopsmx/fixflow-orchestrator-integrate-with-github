
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Loader2, FileCode, GitPullRequest, Clock, TrendingUp, Target } from "lucide-react";
import { codeTestCases } from '@/lib/code-test-data';
import { CodeFinding } from '@/types/code';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { runAutoFixWorkflow } from '@/lib/autofix-workflow';
import { AutoFixResult, IssueMetadata } from '@/types/workflow';
import AutoFixResultDisplay from './AutoFixResultDisplay';

const CodeRemediationAgent = () => {
  const [selectedFinding, setSelectedFinding] = useState<CodeFinding | null>(null);
  const [autoFixResult, setAutoFixResult] = useState<AutoFixResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectFinding = (findingId: string) => {
    const finding = codeTestCases.find(c => c.findingId === findingId) || null;
    setSelectedFinding(finding);
    setAutoFixResult(null);
  };

  const generateRiskScore = (severity: 'Critical' | 'High' | 'Medium' | 'Low'): number => {
    switch (severity) {
      case 'Critical': return 0.9 + Math.random() * 0.1;
      case 'High': return 0.7 + Math.random() * 0.2;
      case 'Medium': return 0.4 + Math.random() * 0.3;
      case 'Low': return 0.1 + Math.random() * 0.3;
      default: return 0.5;
    }
  };

  const handleGenerateFix = async () => {
    if (!selectedFinding) return;
    setIsLoading(true);
    setAutoFixResult(null);
    
    const riskScore = generateRiskScore(selectedFinding.vulnerability.severity);
    
    // Create enriched issue metadata
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
        riskScore,
        codeSnippet: selectedFinding.snippet,
        language: selectedFinding.language,
        fileOwner: 'jane.doe@example.com'
    };

    console.log('[CodeRemediationAgent] Starting enhanced AutoFixWorkflow for enriched issue:', issue);
    
    try {
      const result = await runAutoFixWorkflow(issue);
      console.log('[CodeRemediationAgent] AutoFixWorkflow completed:', result);
      setAutoFixResult(result);
    } catch (error) {
      console.error('[CodeRemediationAgent] AutoFixWorkflow failed:', error);
    } finally {
      setIsLoading(false);
    }
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

  const getRiskScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-red-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-6 w-6" /> Code Remediation Agent
        </CardTitle>
        <CardDescription>
          Select a SAST/SCA finding to generate automated remediation based on risk score thresholds using our enhanced AutoFix workflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Select onValueChange={handleSelectFinding}>
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
                <Badge variant="destructive" className={`${getSeverityColor(selectedFinding.vulnerability.severity)} text-white`}>
                  {selectedFinding.vulnerability.severity}
                </Badge>
                <span>ID: {selectedFinding.vulnerability.id}</span>
                <Badge variant="outline" className={`${getRiskScoreColor(generateRiskScore(selectedFinding.vulnerability.severity))}`}>
                  Risk: {generateRiskScore(selectedFinding.vulnerability.severity).toFixed(2)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-mono text-sm bg-background p-2 rounded">
                    {selectedFinding.filePath}:{selectedFinding.startLine}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Owner: jane.doe@example.com
                  </p>
                </div>
                <pre className="bg-background p-4 rounded-md overflow-x-auto">
                  <code className={`language-${selectedFinding.language.toLowerCase()}`}>{selectedFinding.snippet}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {autoFixResult && selectedFinding && (
          <div className="space-y-4">
            <AutoFixResultDisplay result={autoFixResult} />
            
            {autoFixResult.metrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Remediation Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-2xl font-bold">
                          {(autoFixResult.metrics.timeToFix / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">Time to Fix</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Target className="h-4 w-4" />
                        <span className="text-2xl font-bold text-green-600">
                          {autoFixResult.metrics.llmAccuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">LLM Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-2xl font-bold text-blue-600">
                          {autoFixResult.metrics.successRate}%
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <h4 className="font-medium text-sm mb-2">Processing Details:</h4>
                    <div className="text-xs space-y-1">
                      <p>Workflow Start: {new Date(autoFixResult.metrics.workflowStartTime).toLocaleTimeString()}</p>
                      <p>Workflow End: {new Date(autoFixResult.metrics.workflowEndTime).toLocaleTimeString()}</p>
                      <p>Processing Time: {autoFixResult.metrics.timeToFix}ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CodeRemediationAgent;
