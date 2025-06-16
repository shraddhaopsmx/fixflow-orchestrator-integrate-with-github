import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCode, Play, CheckCircle, XCircle, Code, GitBranch, AlertTriangle, Undo2 } from 'lucide-react';
import { IaCInput, IaCRemediationResult } from '@/types/iac';
import { IssueMetadata } from '@/types/workflow';
import { iacRemediationService } from '@/lib/iac-remediation-service';
import { runAutoFixWorkflow } from '@/lib/autofix-workflow';
import { allTestCases } from '@/lib/iac-test-data';
import AutoFixResultDisplay from './AutoFixResultDisplay';

const IaCRemediationAgent = () => {
  const [cspmIssue, setCspmIssue] = useState<Partial<IssueMetadata>>({
    id: '',
    type: 'CSPM',
    severity: 'Medium',
    location: {
      filePath: '',
      repository: '',
      branch: 'main',
      resourceId: '',
      region: 'us-east-1'
    },
    description: ''
  });

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
  const [autoFixResult, setAutoFixResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'cspm' | 'manual'>('csmp');

  const handleCSPMRemediation = async () => {
    if (!cspmIssue.id || !cspmIssue.location?.filePath || !cspmIssue.description) return;
    
    setIsProcessing(true);
    try {
      const workflowResult = await runAutoFixWorkflow(cspmIssue as IssueMetadata);
      setAutoFixResult(workflowResult);
      setResult(null);
    } catch (error) {
      console.error('CSPM remediation failed:', error);
      setAutoFixResult({
        workflowId: `wf-${crypto.randomUUID()}`,
        issueId: cspmIssue.id,
        status: 'FAILED',
        decision: 'Failed to process CSPM issue',
        auditLog: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemediate = async () => {
    if (!input.filePath || !input.config || !input.issueMetadata) return;
    
    setIsProcessing(true);
    try {
      const remediationResult = await iacRemediationService.remediateConfiguration(input as IaCInput);
      setResult(remediationResult);
      setAutoFixResult(null);
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

  const updateCSPMIssue = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCspmIssue(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setCspmIssue(prev => ({ ...prev, [field]: value }));
    }
  };

  const renderFileDiff = () => {
    if (!result?.updatedConfig || !input.config) return null;
    
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Configuration Diff
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Original</div>
            <Textarea
              className="min-h-[150px] font-mono text-xs bg-red-50 border-red-200"
              value={input.config}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Fixed</div>
            <Textarea
              className="min-h-[150px] font-mono text-xs bg-green-50 border-green-200"
              value={result.updatedConfig}
              readOnly
            />
          </div>
        </div>
      </div>
    );
  };

  const renderRollbackPlan = () => {
    if (!result?.success) return null;
    
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Undo2 className="h-4 w-4" />
          Rollback Plan
        </label>
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
          <div className="font-medium mb-2">Emergency Rollback Options:</div>
          <ul className="list-disc list-inside space-y-1 text-yellow-800">
            <li>Git revert: <code className="bg-yellow-100 px-1 rounded">git revert HEAD</code></li>
            <li>Terraform: <code className="bg-yellow-100 px-1 rounded">terraform plan -destroy</code></li>
            <li>Backup restore from: <code className="bg-yellow-100 px-1 rounded">{new Date().toISOString()}</code></li>
          </ul>
        </div>
      </div>
    );
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
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'cspm' | 'manual')} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="csmp">CSPM Issues</TabsTrigger>
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
              <TabsTrigger value="test">Test Cases</TabsTrigger>
            </TabsList>
            
            <TabsContent value="csmp" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issue ID</label>
                  <input
                    type="text"
                    placeholder="e.g., CSPM-001"
                    className="w-full px-3 py-2 border rounded-md"
                    value={csmpIssue.id || ''}
                    onChange={(e) => updateCSPMIssue('id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Severity</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={csmpIssue.severity || 'Medium'}
                    onChange={(e) => updateCSPMIssue('severity', e.target.value)}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">File Path</label>
                  <input
                    type="text"
                    placeholder="e.g., terraform/main.tf"
                    className="w-full px-3 py-2 border rounded-md"
                    value={csmpIssue.location?.filePath || ''}
                    onChange={(e) => updateCSPMIssue('location.filePath', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Repository</label>
                  <input
                    type="text"
                    placeholder="e.g., my-app-repo"
                    className="w-full px-3 py-2 border rounded-md"
                    value={csmpIssue.location?.repository || ''}
                    onChange={(e) => updateCSPMIssue('location.repository', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch</label>
                  <input
                    type="text"
                    placeholder="e.g., main"
                    className="w-full px-3 py-2 border rounded-md"
                    value={csmpIssue.location?.branch || 'main'}
                    onChange={(e) => updateCSPMIssue('location.branch', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resource ID</label>
                  <input
                    type="text"
                    placeholder="e.g., aws_s3_bucket.example"
                    className="w-full px-3 py-2 border rounded-md"
                    value={csmpIssue.location?.resourceId || ''}
                    onChange={(e) => updateCSPMIssue('location.resourceId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Region</label>
                  <input
                    type="text"
                    placeholder="e.g., us-east-1"
                    className="w-full px-3 py-2 border rounded-md"
                    value={csmpIssue.location?.region || 'us-east-1'}
                    onChange={(e) => updateCSPMIssue('location.region', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Issue Description</label>
                <Textarea
                  placeholder="Describe the CSPM security issue..."
                  className="min-h-[100px]"
                  value={csmpIssue.description || ''}
                  onChange={(e) => updateCSPMIssue('description', e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleCSPMRemediation}
                  disabled={!csmpIssue.id || !csmpIssue.location?.filePath || isProcessing}
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
                      Generate Fix
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
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
        </CardContent>
      </Card>

      {autoFixResult && (
        <AutoFixResultDisplay result={autoFixResult} />
      )}

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

            {renderFileDiff()}
            {renderRollbackPlan()}

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
