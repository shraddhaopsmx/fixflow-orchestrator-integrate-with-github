
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cloudTestCases } from '@/lib/cloud-test-data';
import { cloudRemediationService } from '@/lib/cloud-remediation-service';
import { CSPMFinding, RemediationPlan } from '@/types/cloud';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Play, Edit, Check, X, Eye, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RemediationStep {
  step_no: number;
  command_type: 'RUN-CLI-COMMAND' | 'VERIFY-OUTPUT-FROM-PREVIOUS-STEP';
  comment: string;
  command: string | null;
  input_variables: string[];
  output_variables: string[];
  status?: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
}

interface PlannerResponse {
  success: boolean;
  steps: RemediationStep[];
  summary: string;
  confidence: number;
}

const CloudRemediationAgent = () => {
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'select' | 'planner' | 'executor'>('select');
  const [plannerResponse, setPlannerResponse] = useState<PlannerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [currentExecutingStep, setCurrentExecutingStep] = useState<number | null>(null);

  const selectedFinding = cloudTestCases.find(f => f.findingId === selectedFindingId);

  const handleGeneratePlan = async () => {
    if (!selectedFinding) return;

    setIsLoading(true);
    setCurrentPhase('planner');
    toast.info("AI is analyzing the issue and generating remediation plan...");
    
    try {
      // Simulate AI planner response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockPlannerResponse: PlannerResponse = {
        success: true,
        confidence: 92,
        summary: `Generated comprehensive remediation plan for ${selectedFinding.description}`,
        steps: [
          {
            step_no: 1,
            command_type: "RUN-CLI-COMMAND",
            comment: "Enable EBS encryption by default for the specified AWS region.",
            command: "aws ec2 enable-ebs-encryption-by-default --region <region>",
            input_variables: ["region"],
            output_variables: [],
            status: 'pending'
          },
          {
            step_no: 2,
            command_type: "VERIFY-OUTPUT-FROM-PREVIOUS-STEP",
            comment: "Confirm the command was successful and encryption by default is now enabled.",
            command: null,
            input_variables: [],
            output_variables: [],
            status: 'pending'
          },
          {
            step_no: 3,
            command_type: "RUN-CLI-COMMAND",
            comment: "Verify that EBS encryption by default is enabled.",
            command: "aws ec2 get-ebs-encryption-by-default --region <region>",
            input_variables: ["region"],
            output_variables: ["encryption_status"],
            status: 'pending'
          },
          {
            step_no: 4,
            command_type: "VERIFY-OUTPUT-FROM-PREVIOUS-STEP",
            comment: "Check the encryption status to ensure it is enabled.",
            command: null,
            input_variables: ["encryption_status"],
            output_variables: [],
            status: 'pending'
          }
        ]
      };
      
      setPlannerResponse(mockPlannerResponse);
      toast.success("Remediation plan generated successfully!");
    } catch (e) {
      toast.error("Failed to generate remediation plan.");
      setCurrentPhase('select');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecutePlan = async () => {
    if (!plannerResponse) return;

    setExecutionStatus('running');
    setCurrentPhase('executor');
    toast.info("Starting plan execution...");

    try {
      for (let i = 0; i < plannerResponse.steps.length; i++) {
        setCurrentExecutingStep(i);
        
        // Update step status to running
        setPlannerResponse(prev => {
          if (!prev) return null;
          const updatedSteps = [...prev.steps];
          updatedSteps[i] = { ...updatedSteps[i], status: 'running' };
          return { ...prev, steps: updatedSteps };
        });

        // Simulate execution time
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update step status to completed with mock output
        setPlannerResponse(prev => {
          if (!prev) return null;
          const updatedSteps = [...prev.steps];
          updatedSteps[i] = { 
            ...updatedSteps[i], 
            status: 'completed',
            output: updatedSteps[i].command ? 'Command executed successfully' : 'Verification passed'
          };
          return { ...prev, steps: updatedSteps };
        });
      }

      setExecutionStatus('completed');
      setCurrentExecutingStep(null);
      toast.success("All remediation steps completed successfully!");
    } catch (error) {
      setExecutionStatus('failed');
      toast.error("Execution failed. Please review the steps.");
    }
  };

  const handleEditStep = (stepIndex: number) => {
    setEditingStep(stepIndex);
  };

  const handleApproveStep = (stepIndex: number) => {
    toast.success(`Step ${stepIndex + 1} approved`);
    setEditingStep(null);
  };

  const resetWorkflow = () => {
    setCurrentPhase('select');
    setPlannerResponse(null);
    setExecutionStatus('idle');
    setCurrentExecutingStep(null);
    setEditingStep(null);
    setSelectedFindingId(null);
  };

  const getSeverityBadge = (severity: 'Critical' | 'High' | 'Medium' | 'Low') => {
    switch(severity) {
      case 'Critical': return 'bg-red-600';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-blue-500';
    }
  };

  const getStepStatusIcon = (status?: string) => {
    switch(status) {
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <X className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Cloud Remediation Agent (AI-Powered)
          </CardTitle>
          <CardDescription>
            Two-phase AI remediation: Plan generation and automated execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentPhase} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="select" disabled={currentPhase !== 'select'}>
                1. Select Issue
              </TabsTrigger>
              <TabsTrigger value="planner" disabled={currentPhase === 'select'}>
                2. AI Planner
              </TabsTrigger>
              <TabsTrigger value="executor" disabled={currentPhase !== 'executor'}>
                3. Executor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="select" className="space-y-4">
              <div className="flex items-center gap-4">
                <Select onValueChange={setSelectedFindingId} value={selectedFindingId || ''}>
                  <SelectTrigger className="w-[400px]">
                    <SelectValue placeholder="Select a CSPM finding to remediate..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cloudTestCases.map((finding) => (
                      <SelectItem key={finding.findingId} value={finding.findingId}>
                        {finding.findingId}: {finding.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleGeneratePlan} 
                  disabled={!selectedFindingId || isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Generate Plan
                    </>
                  )}
                </Button>
              </div>

              {selectedFinding && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Selected Finding</CardTitle>
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
            </TabsContent>

            <TabsContent value="planner" className="space-y-4">
              {plannerResponse && (
                <>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>AI Planner Results</AlertTitle>
                    <AlertDescription>
                      {plannerResponse.summary} (Confidence: {plannerResponse.confidence}%)
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Remediation Plan</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleExecutePlan}
                          disabled={executionStatus === 'running'}
                          className="flex items-center gap-2"
                        >
                          <Play className="h-4 w-4" />
                          Execute Plan
                        </Button>
                        <Button variant="outline" onClick={resetWorkflow}>
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {plannerResponse.steps.map((step, index) => (
                          <div key={step.step_no} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getStepStatusIcon(step.status)}
                                <div>
                                  <h4 className="font-medium">Step {step.step_no}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {step.command_type.replace(/-/g, ' ')}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-600">
                                    <DialogHeader>
                                      <DialogTitle>Step {step.step_no} Details</DialogTitle>
                                      <DialogDescription>
                                        Review and modify the step details
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <label className="text-sm font-medium">Comment:</label>
                                        <p className="text-sm text-muted-foreground">{step.comment}</p>
                                      </div>
                                      {step.command && (
                                        <div>
                                          <label className="text-sm font-medium">Command:</label>
                                          <pre className="bg-gray-900 text-white p-3 rounded text-sm mt-1">
                                            {step.command}
                                          </pre>
                                        </div>
                                      )}
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleApproveStep(index)}>
                                          <Check className="h-4 w-4 mr-1" />
                                          Approve
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleEditStep(index)}>
                                          <Edit className="h-4 w-4 mr-1" />
                                          Edit
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">{step.comment}</p>
                            
                            {step.command && (
                              <pre className="bg-gray-900 text-white p-3 rounded text-sm overflow-x-auto">
                                {step.command}
                              </pre>
                            )}
                            
                            {step.status === 'completed' && step.output && (
                              <div className="bg-green-50 border border-green-200 p-3 rounded">
                                <p className="text-sm text-green-800">{step.output}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="executor" className="space-y-4">
              <Alert className={executionStatus === 'completed' ? 'border-green-200 bg-green-50' : 
                              executionStatus === 'failed' ? 'border-red-200 bg-red-50' : ''}>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Execution Status</AlertTitle>
                <AlertDescription>
                  {executionStatus === 'running' && `Executing step ${(currentExecutingStep || 0) + 1} of ${plannerResponse?.steps.length || 0}...`}
                  {executionStatus === 'completed' && 'All remediation steps completed successfully!'}
                  {executionStatus === 'failed' && 'Execution failed. Please review the steps and try again.'}
                  {executionStatus === 'idle' && 'Ready to execute the remediation plan.'}
                </AlertDescription>
              </Alert>

              {plannerResponse && (
                <Card>
                  <CardHeader>
                    <CardTitle>Execution Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {plannerResponse.steps.map((step, index) => (
                        <div key={step.step_no} className="flex items-center gap-3 p-3 border rounded-lg">
                          {getStepStatusIcon(step.status)}
                          <div className="flex-1">
                            <p className="font-medium">Step {step.step_no}</p>
                            <p className="text-sm text-muted-foreground">{step.comment}</p>
                          </div>
                          {step.status === 'completed' && (
                            <Badge variant="default" className="bg-green-500">
                              Completed
                            </Badge>
                          )}
                          {step.status === 'running' && (
                            <Badge variant="default" className="bg-blue-500">
                              Running
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {executionStatus === 'completed' && (
                      <div className="mt-6 flex justify-center">
                        <Button onClick={resetWorkflow} variant="outline">
                          Start New Remediation
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CloudRemediationAgent;
