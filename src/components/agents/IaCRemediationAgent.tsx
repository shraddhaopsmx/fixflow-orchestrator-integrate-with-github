import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCode, Bot, Loader2 } from 'lucide-react';
import { IaCInput } from '@/types/iac';
import { allTestCases } from '@/lib/iac-test-data';
import { runAutoFixWorkflow } from '@/lib/autofix-workflow';
import { AutoFixResult, IssueMetadata } from '@/types/workflow';
import AutoFixResultDisplay from './AutoFixResultDisplay';
import { toast } from 'sonner';

const IaCRemediationAgent = () => {
  const [input, setInput] = useState<Partial<IaCInput>>({
    filePath: '',
    config: '',
    issueMetadata: {
      issueId: '',
      title: '',
      severity: 'Medium',
      description: '',
      category: 'terraform',
      ruleId: ''
    }
  });
  
  const [autoFixResult, setAutoFixResult] = useState<AutoFixResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('');

  const handleGenerateFix = async () => {
    if (!input.filePath || !input.config || !input.issueMetadata?.issueId) {
      toast.error("Please fill all required fields or load a test case.");
      return;
    }
    
    setIsLoading(true);
    setAutoFixResult(null);

    const issue: IssueMetadata = {
      id: input.issueMetadata.issueId,
      type: 'CSPM',
      severity: input.issueMetadata.severity,
      location: {
        filePath: input.filePath,
        repository: 'github.com/example/iac-repo',
        branch: 'main',
      },
      description: input.issueMetadata.description || input.issueMetadata.title || 'IaC Misconfiguration',
    };

    try {
      const result = await runAutoFixWorkflow(issue);
      setAutoFixResult(result);
    } catch (error) {
       toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTestCase = (testName: string) => {
    const testCase = allTestCases.find(t => t.name === testName);
    if (testCase) {
      setInput(testCase.input);
      setAutoFixResult(null);
      setSelectedTest(testName);
    }
  };

  const updateIssueMetadata = (field: string, value: any) => {
    setInput(prev => ({
      ...prev,
      issueMetadata: {
        ...prev.issueMetadata!,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            <CardTitle>IaC Remediation Agent</CardTitle>
          </div>
          <CardDescription>
            Automatically fix Terraform and Kubernetes security misconfigurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
              <TabsTrigger value="test">Test Cases</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">File Path</label>
                  <input
                    type="text"
                    placeholder="e.g., terraform/main.tf"
                    className="w-full px-3 py-2 border rounded-md"
                    value={input.filePath || ''}
                    onChange={(e) => setInput(prev => ({ ...prev, filePath: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={input.issueMetadata?.category || 'terraform'}
                    onChange={(e) => updateIssueMetadata('category', e.target.value)}
                  >
                    <option value="terraform">Terraform</option>
                    <option value="kubernetes">Kubernetes</option>
                  </select>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issue Title</label>
                  <input
                    type="text"
                    placeholder="e.g., S3 bucket is public"
                    className="w-full px-3 py-2 border rounded-md"
                    value={input.issueMetadata?.title || ''}
                    onChange={(e) => updateIssueMetadata('title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Severity</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={input.issueMetadata?.severity || 'Medium'}
                    onChange={(e) => updateIssueMetadata('severity', e.target.value)}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issue ID</label>
                  <input
                    type="text"
                    placeholder="e.g., TF-001"
                    className="w-full px-3 py-2 border rounded-md"
                    value={input.issueMetadata?.issueId || ''}
                    onChange={(e) => updateIssueMetadata('issueId', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Configuration</label>
                <Textarea
                  placeholder="Paste your Terraform or Kubernetes configuration here..."
                  className="min-h-[200px] font-mono text-sm"
                  value={input.config || ''}
                  onChange={(e) => setInput(prev => ({ ...prev, config: e.target.value }))}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="test" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Test Case</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedTest}
                  onChange={(e) => loadTestCase(e.target.value)}
                >
                  <option value="">Choose a test case...</option>
                  {allTestCases.map(test => (
                    <option key={test.name} value={test.name}>
                      {test.name} ({test.input.issueMetadata.category})
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedTest && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Configuration</label>
                  <Textarea
                    className="min-h-[200px] font-mono text-sm"
                    value={input.config || ''}
                    readOnly
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleGenerateFix}
              disabled={!input.filePath || !input.config || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Generate Fix
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AutoFixResultDisplay autoFixResult={autoFixResult} />
      
    </div>
  );
};

export default IaCRemediationAgent;
