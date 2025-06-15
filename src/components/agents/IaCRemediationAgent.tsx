
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCode, Play, CheckCircle, XCircle, Code } from 'lucide-react';
import { IaCInput, IaCRemediationResult } from '@/types/iac';
import { iacRemediationService } from '@/lib/iac-remediation-service';
import { allTestCases } from '@/lib/iac-test-data';

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
  
  const [result, setResult] = useState<IaCRemediationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('');

  const handleRemediate = async () => {
    if (!input.filePath || !input.config || !input.issueMetadata) return;
    
    setIsProcessing(true);
    try {
      const remediationResult = await iacRemediationService.remediateConfiguration(input as IaCInput);
      setResult(remediationResult);
    } catch (error) {
      console.error('Remediation failed:', error);
      setResult({
        success: false,
        explanation: 'Failed to process configuration',
        appliedRules: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const loadTestCase = (testName: string) => {
    const testCase = allTestCases.find(t => t.name === testName);
    if (testCase) {
      setInput(testCase.input);
      setResult(null);
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
              onClick={handleRemediate}
              disabled={!input.filePath || !input.config || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Remediate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <CardTitle>Remediation Result</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? "Success" : "Failed"}
              </Badge>
              {result.appliedRules.length > 0 && (
                <Badge variant="outline">
                  {result.appliedRules.length} rule{result.appliedRules.length > 1 ? 's' : ''} applied
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Explanation</label>
              <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {result.explanation}
              </div>
            </div>

            {result.updatedConfig && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Updated Configuration</label>
                <Textarea
                  className="min-h-[200px] font-mono text-sm"
                  value={result.updatedConfig}
                  readOnly
                />
              </div>
            )}

            {result.jsonPatch && result.jsonPatch.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">JSON Patches</label>
                <pre className="p-3 bg-muted rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(result.jsonPatch, null, 2)}
                </pre>
              </div>
            )}

            {result.error && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-red-600">Error Details</label>
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {result.error}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IaCRemediationAgent;
