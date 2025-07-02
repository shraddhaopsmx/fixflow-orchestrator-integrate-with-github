
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cloudTestCases } from '@/lib/cloud-test-data';
import { cloudRemediationService } from '@/lib/cloud-remediation-service';
import { CSPMFinding, RemediationPlan } from '@/types/cloud';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Play, Edit, Check, X, Clock, AlertTriangle, CheckCircle, Bot, User, Send } from "lucide-react";
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

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isEditing?: boolean;
}

const CloudRemediationAgent = () => {
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'select' | 'planner' | 'executor'>('select');
  const [plannerResponse, setPlannerResponse] = useState<PlannerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [currentExecutingStep, setCurrentExecutingStep] = useState<number | null>(null);
  
  // Chat-like interface state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [editingPlan, setEditingPlan] = useState<string>('');
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isPlanApproved, setIsPlanApproved] = useState(false);

  const selectedFinding = cloudTestCases.find(f => f.findingId === selectedFindingId);

  const formatPlanAsText = (steps: RemediationStep[]): string => {
    return steps.map(step => 
      `**Step ${step.step_no}:** ${step.comment}\n${step.command ? `Command: \`${step.command}\`` : 'Verification step'}\n`
    ).join('\n');
  };

  const handleGeneratePlan = async () => {
    if (!selectedFinding) return;

    setIsLoading(true);
    setCurrentPhase('planner');
    setChatMessages([]);
    setIsPlanApproved(false);
    toast.info("AI is analyzing the issue and generating remediation plan...");
    
    try {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: `Please generate a remediation plan for: ${selectedFinding.description}`,
        timestamp: new Date()
      };
      setChatMessages([userMessage]);

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
      
      // Add AI response message
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: formatPlanAsText(mockPlannerResponse.steps),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
      setEditingPlan(formatPlanAsText(mockPlannerResponse.steps));
      
      toast.success("Remediation plan generated successfully!");
    } catch (e) {
      toast.error("Failed to generate remediation plan.");
      setCurrentPhase('select');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFeedback = () => {
    if (!userInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setUserInput('');

    // Simulate AI response to feedback
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I understand your feedback. Let me adjust the plan accordingly...",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleEditPlan = () => {
    setIsEditingPlan(true);
  };

  const handleSavePlan = () => {
    setIsEditingPlan(false);
    setIsPlanApproved(true);
    // Update the chat message with edited content
    setChatMessages(prev => 
      prev.map(msg => 
        msg.type === 'ai' && msg.content.includes('Step') 
          ? { ...msg, content: editingPlan }
          : msg
      )
    );
    toast.success("Plan updated and approved!");
  };

  const handleApprovePlan = () => {
    setIsPlanApproved(true);
    toast.success("Plan approved! Proceeding to execution...");
    setTimeout(() => {
      setCurrentPhase('executor');
    }, 1000);
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

  const resetWorkflow = () => {
    setCurrentPhase('select');
    setPlannerResponse(null);
    setExecutionStatus('idle');
    setCurrentExecutingStep(null);
    setSelectedFindingId(null);
    setChatMessages([]);
    setUserInput('');
    setEditingPlan('');
    setIsEditingPlan(false);
    setIsPlanApproved(false);
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

            <TabsContent value="planner" className="space-y-6">
              {plannerResponse && (
                <>
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">AI Analysis Complete</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      {plannerResponse.summary} (Confidence: {plannerResponse.confidence}%)
                    </AlertDescription>
                  </Alert>

                  {/* Modern Chat Interface */}
                  <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
                    {/* Chat Messages */}
                    <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
                      {chatMessages.map((message) => (
                        <div key={message.id} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                              message.type === 'user' 
                                ? 'bg-blue-500' 
                                : 'bg-gradient-to-br from-purple-500 to-blue-600'
                            }`}>
                              {message.type === 'user' ? 
                                <User className="h-4 w-4 text-white" /> : 
                                <Bot className="h-4 w-4 text-white" />
                              }
                            </div>
                            
                            {/* Message Bubble */}
                            <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                              message.type === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white border border-gray-200'
                            }`}>
                              {message.type === 'ai' && message.content.includes('Step') ? (
                                <div className="space-y-4">
                                  {isEditingPlan ? (
                                    <div className="space-y-3">
                                      <Textarea
                                        value={editingPlan}
                                        onChange={(e) => setEditingPlan(e.target.value)}
                                        className="min-h-[200px] font-mono text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Edit the remediation plan..."
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={handleSavePlan} className="bg-green-600 hover:bg-green-700">
                                          <Check className="h-4 w-4 mr-1" />
                                          Save & Approve
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setIsEditingPlan(false)}>
                                          <X className="h-4 w-4 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      <div className="prose prose-sm max-w-none">
                                        <div className="bg-gray-50 p-4 rounded-lg border font-mono text-sm whitespace-pre-wrap">
                                          {message.content}
                                        </div>
                                      </div>
                                      
                                      {/* Action Buttons */}
                                      {!isPlanApproved && (
                                        <div className="flex gap-2 pt-2">
                                          <Button 
                                            size="sm" 
                                            onClick={handleApprovePlan}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                          >
                                            <Check className="h-4 w-4 mr-1" />
                                            Approve
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={handleEditPlan}
                                            className="border-gray-300 hover:bg-gray-50"
                                          >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                          </Button>
                                        </div>
                                      )}
                                      
                                      {isPlanApproved && (
                                        <div className="flex items-center gap-2 pt-2">
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                          <span className="text-sm text-green-600 font-medium">Plan Approved</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              )}
                              
                              <div className={`text-xs mt-2 ${
                                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* User Input Area */}
                    <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl">
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <Input
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Ask questions or provide feedback about the plan..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSendFeedback()}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <Button 
                          onClick={handleSendFeedback} 
                          disabled={!userInput.trim()}
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button variant="outline" onClick={resetWorkflow} className="border-gray-300">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleExecutePlan}
                      disabled={!isPlanApproved || executionStatus === 'running' || isEditingPlan}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Execute Plan
                    </Button>
                  </div>
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
