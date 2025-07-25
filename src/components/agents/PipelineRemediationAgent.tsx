
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Settings, PlayCircle, FileText } from "lucide-react";
import { pipelineRemediationService } from "@/lib/pipeline-remediation-service";
import { allPipelineTestCases } from "@/lib/pipeline-test-data";
import { PipelineInput, PipelineRemediationResult } from "@/types/pipeline";
import { useToast } from "@/hooks/use-toast";

const PipelineRemediationAgent = () => {
  const [input, setInput] = useState<PipelineInput>({
    filePath: '',
    config: '',
    pipelineType: 'github-actions',
    metadata: {}
  });
  const [result, setResult] = useState<PipelineRemediationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleRemediate = async () => {
    if (!input.config.trim()) {
      toast({
        title: "Missing Configuration",
        description: "Please provide a pipeline configuration to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const remediationResult = await pipelineRemediationService.remediatePipeline(input);
      setResult(remediationResult);
      
      if (remediationResult.success) {
        toast({
          title: "Pipeline Analysis Complete",
          description: `Applied ${remediationResult.appliedRules.length} security fixes.`,
        });
      }
    } catch (error) {
      toast({
        title: "Remediation Failed",
        description: "An error occurred during pipeline analysis.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    const results = [];
    
    for (const testCase of allPipelineTestCases) {
      try {
        const result = await pipelineRemediationService.remediatePipeline(testCase.input);
        const passed = result.success === testCase.expectedOutput.success;
        results.push({
          name: testCase.name,
          passed,
          result,
          expected: testCase.expectedOutput
        });
      } catch (error) {
        results.push({
          name: testCase.name,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    setTestResults(results);
    setIsLoading(false);
    
    const passedCount = results.filter(r => r.passed).length;
    toast({
      title: "Test Suite Complete",
      description: `${passedCount}/${results.length} tests passed.`,
    });
  };

  const loadExampleConfig = (type: 'github-actions' | 'jenkins') => {
    const examples = {
      'github-actions': `name: CI Pipeline
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      API_KEY: hardcoded-secret-123
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm run build --skip-tests
      - run: npm run deploy`,
      'jenkins': `pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }
        
        stage('Deploy to Production') {
            steps {
                sh 'kubectl apply -f production/'
            }
        }
    }
}`
    };

    setInput({
      ...input,
      config: examples[type],
      pipelineType: type,
      filePath: type === 'github-actions' ? '.github/workflows/ci.yml' : 'Jenkinsfile'
    });
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            CI/CD Pipeline Remediation Agent
          </CardTitle>
          <CardDescription>
            Analyze and fix security risks in GitHub Actions workflows and Jenkins pipelines
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="remediate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="remediate">Remediate</TabsTrigger>
          <TabsTrigger value="test">Test Suite</TabsTrigger>
          <TabsTrigger value="rules">Available Rules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="remediate" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pipeline Configuration</CardTitle>
                <CardDescription>
                  Paste your GitHub Actions workflow or Jenkinsfile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="filePath">File Path</Label>
                  <Input
                    id="filePath"
                    placeholder=".github/workflows/ci.yml or Jenkinsfile"
                    value={input.filePath}
                    onChange={(e) => setInput({ ...input, filePath: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="pipelineType">Pipeline Type</Label>
                  <Select
                    value={input.pipelineType}
                    onValueChange={(value: 'github-actions' | 'jenkins') => 
                      setInput({ ...input, pipelineType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github-actions">GitHub Actions</SelectItem>
                      <SelectItem value="jenkins">Jenkins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadExampleConfig('github-actions')}
                  >
                    Load GitHub Actions Example
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadExampleConfig('jenkins')}
                  >
                    Load Jenkins Example
                  </Button>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="config">Pipeline Configuration</Label>
                  <Textarea
                    id="config"
                    placeholder="Paste your pipeline configuration here..."
                    value={input.config}
                    onChange={(e) => setInput({ ...input, config: e.target.value })}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
                
                <Button onClick={handleRemediate} disabled={isLoading} className="w-full">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {isLoading ? 'Analyzing...' : 'Analyze Pipeline'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Remediation Results</CardTitle>
                <CardDescription>
                  Security fixes and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!result ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Configure and analyze a pipeline to see results</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">
                        {result.success ? 'Analysis Complete' : 'Analysis Failed'}
                      </span>
                    </div>
                    
                    {result.appliedRules.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Applied Rules:</h4>
                        <div className="flex flex-wrap gap-1">
                          {result.appliedRules.map((ruleId) => (
                            <Badge key={ruleId} variant="outline" className="text-xs">
                              {ruleId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.insertedSteps && result.insertedSteps.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Inserted Steps:</h4>
                        <div className="flex flex-wrap gap-1">
                          {result.insertedSteps.map((step) => (
                            <Badge key={step} variant="secondary" className="text-xs">
                              {step}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium mb-2">Explanation:</h4>
                      <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                        {result.explanation}
                      </div>
                    </div>
                    
                    {result.updatedConfig && (
                      <div>
                        <h4 className="font-medium mb-2">Updated Configuration:</h4>
                        <Textarea
                          value={result.updatedConfig}
                          readOnly
                          rows={8}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pipeline Security Test Suite</CardTitle>
                  <CardDescription>
                    Validate remediation rules against known pipeline vulnerabilities
                  </CardDescription>
                </div>
                <Button onClick={runAllTests} disabled={isLoading}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {isLoading ? 'Running...' : 'Run All Tests'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Run All Tests" to validate remediation rules</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {test.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium">{test.name}</span>
                      </div>
                      <Badge variant={test.passed ? "default" : "destructive"}>
                        {test.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Remediation Rules</CardTitle>
              <CardDescription>
                Security rules for GitHub Actions and Jenkins pipelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineRemediationService.getAvailableRules().map((rule) => (
                  <div key={rule.id} className="p-4 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{rule.name}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">{rule.pipelineType}</Badge>
                        <Badge className={getRiskBadgeColor(rule.riskLevel)}>
                          {rule.riskLevel}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Rule ID: {rule.id}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PipelineRemediationAgent;
