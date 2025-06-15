
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitPullRequest, Bot, Loader2, FileCode } from "lucide-react";
import { codeTestCases } from '@/lib/code-test-data';
import { codeRemediationService } from '@/lib/code-remediation-service';
import { CodeFinding, CodeRemediation } from '@/types/code';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

const CodeRemediationAgent = () => {
  const [selectedFinding, setSelectedFinding] = useState<CodeFinding | null>(null);
  const [remediation, setRemediation] = useState<CodeRemediation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectFinding = (findingId: string) => {
    const finding = codeTestCases.find(c => c.findingId === findingId) || null;
    setSelectedFinding(finding);
    setRemediation(null);
  };

  const handleGenerateFix = async () => {
    if (!selectedFinding) return;
    setIsLoading(true);
    setRemediation(null);
    const result = await codeRemediationService.generateFix(selectedFinding);
    setRemediation(result);
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

        {remediation && (
          <Tabs defaultValue="explanation">
            <TabsList>
              <TabsTrigger value="explanation">Explanation</TabsTrigger>
              <TabsTrigger value="patch">Suggested Patch</TabsTrigger>
              <TabsTrigger value="pr">GitHub PR</TabsTrigger>
            </TabsList>
            <TabsContent value="explanation" className="mt-4">
              <p className="text-sm whitespace-pre-wrap">{remediation.explanation}</p>
            </TabsContent>
            <TabsContent value="patch" className="mt-4">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                <code>{remediation.suggestedPatch}</code>
              </pre>
            </TabsContent>
            <TabsContent value="pr" className="mt-4">
              {remediation.githubPr ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <GitPullRequest className="h-5 w-5 text-purple-600" />
                     <a href={remediation.githubPr.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                        {remediation.githubPr.title}
                     </a>
                  </div>
                   <div>
                    {remediation.githubPr.labels.map(label => (
                      <Badge key={label} variant="outline" className="mr-2 mb-2">{label}</Badge>
                    ))}
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">PR Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <pre className="text-sm whitespace-pre-wrap font-sans">{remediation.githubPr.body}</pre>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p>Could not generate a GitHub Pull Request.</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default CodeRemediationAgent;
