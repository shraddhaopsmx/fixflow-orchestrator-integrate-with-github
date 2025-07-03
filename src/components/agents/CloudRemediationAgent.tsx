
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cloudTestCases } from '@/lib/cloud-test-data';
import { CSPMFinding } from '@/types/cloud';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Play, Edit, Check, X, Clock, AlertTriangle, CheckCircle, Send, Bot, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

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
  type: 'system' | 'user';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const CloudRemediationAgent = () => {
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'select' | 'planner' | 'executor'>('select');
  const [plannerResponse, setPlannerResponse] = useState<PlannerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [currentExecutingStep, setCurrentExecutingStep] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState('');

  const selectedFinding = cloudTestCases.find(f => f.findingId === selectedFindingId);

  const formatPlanAsMessage = (response: PlannerResponse): string => {
    let content = `## Remediation Plan\n\n**Confidence**: ${response.confidence}%\n\n**Summary**: ${response.summary}\n\n`;
    
    response.steps.forEach((step, index) => {
      content += `### Step ${step.step_no}: ${step.command_type.replace(/-/g, ' ')}\n\n`;
      content += `${step.comment}\n\n`;
      
      if (step.command) {
        content += `\`\`\`bash\n${step.command}\n\`\`\`\n\n`;
      }
      
      if (step.input_variables.length > 0) {
        content += `**Input Variables**: ${step.input_variables.join(', ')}\n\n`;
      }
      
      if (step.output_variables.length > 0) {
        content += `**Output Variables**: ${step.output_variables.join(', ')}\n\n`;
      }
    });
    
    return content;
  };

  const simulateStreaming = async (content: string, messageId: string) => {
    setIsStreaming(true);
    const words = content.split(' ');
    let currentContent = '';
    
    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? ' ' : '') + words[i];
      
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: currentContent, isStreaming: true }
            : msg
        )
      );
      
      // Add slight delay to simulate typing
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Mark streaming as complete
    setChatMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isStreaming: false }
          : msg
      )
    );
    
    setIsStreaming(false);
  };

  const handleGeneratePlan = async () => {
    if (!selectedFinding) return;

    setIsLoading(true);
    setCurrentPhase('planner');
    
    // Add initial system message
    const initialMessage: ChatMessage = {
      id: 'system-initial',
      type: 'system',
      content: `Analyzing the security issue: **${selectedFinding.description}**\n\nGenerating comprehensive remediation plan...`,
      timestamp: new Date()
    };
    
    setChatMessages([initialMessage]);
    toast.info("AI is analyzing the issue and generating remediation plan...");
    
    try {
      // Simulate AI thinking time
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
      
      // Add the plan as a streaming message
      const planContent = formatPlanAsMessage(mockPlannerResponse);
      const planMessageId = 'plan-message';
      
      const planMessage: ChatMessage = {
        id: planMessageId,
        type: 'system',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };
      
      setChatMessages(prev => [...prev, planMessage]);
      
      // Start streaming the plan
      await simulateStreaming(planContent, planMessageId);
      
      toast.success("Remediation plan generated successfully!");
    } catch (e) {
      toast.error("Failed to generate remediation plan.");
      setCurrentPhase('select');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    
    // Simulate AI response to user feedback
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `system-${Date.now()}`,
        type: 'system',
        content: `Thank you for your feedback. I've noted your input: "${userInput}". The plan has been updated accordingly and is ready for your approval.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleEditPlan = () => {
    if (plannerResponse) {
      setEditedPlan(formatPlanAsMessage(plannerResponse));
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    // Update the plan message with edited content
    setChatMessages(prev => 
      prev.map(msg => 
        msg.id === 'plan-message' 
          ? { ...msg, content: editedPlan }
          : msg
      )
    );
    setIsEditing(false);
    toast.success("Plan updated and approved!");
  };

  const handleApprovePlan = () => {
    setCurrentPhase('executor');
    toast.success("Plan approved! Moving to execution phase.");
  };

  const handleExecutePlan = async () => {
    if (!plannerResponse) return;

    setExecutionStatus('running');
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
    setIsEditing(false);
    setEditedPlan('');
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

  const renderMessage = (message: ChatMessage) => {
    const isSystem = message.type === 'system';
    
    return (
      <div key={message.id} className={`flex gap-3 mb-6 ${isSystem ? 'justify-start' : 'justify-end'}`}>
        {isSystem && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[80%] ${isSystem ? '' : 'order-first'}`}>
          <div className={`rounded-lg p-4 ${
            isSystem 
              ? 'bg-gray-50 border border-gray-200' 
              : 'bg-blue-500 text-white ml-auto'
          }`}>
            <div className="prose prose-sm max-w-none">
              {message.content.split('\n').map((line, index) => {
                if (line.startsWith('##')) {
                  return <h2 key={index} className="text-lg font-semibold mb-2 mt-0">{line.replace('##', '').trim()}</h2>;
                } else if (line.startsWith('###')) {
                  return <h3 key={index} className="text-md font-medium mb-2 mt-4 first:mt-0">{line.replace('###', '').trim()}</h3>;
                } else if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={index} className="font-medium mb-1">{line.replace(/\*\*/g, '')}</p>;
                } else if (line.startsWith('```')) {
                  return null; // Handle code blocks separately
                } else if (line.trim()) {
                  return <p key={index} className="mb-2 last:mb-0">{line}</p>;
                }
                return <br key={index} />;
              })}
              
              {/* Handle code blocks */}
              {message.content.includes('```') && (
                <div className="mt-2">
                  {message.content.split('```').map((block, index) => {
                    if (index % 2 === 1) {
                      const [lang, ...codeLines] = block.split('\n');
                      const code = codeLines.join('\n').trim();
                      return (
                        <pre key={index} className="bg-gray-900 text-white p-3 rounded text-sm overflow-x-auto my-2">
                          <code>{code}</code>
                        </pre>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
            
            {message.isStreaming && (
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mt-1 px-1">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
        
        {!isSystem && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-green-100 text-green-600">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
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
              {/* Chat Interface */}
              <div className="h-[600px] flex flex-col">
                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white rounded-lg border">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>AI Planner will appear here...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map(renderMessage)}
                      
                      {/* Action Buttons after plan is generated */}
                      {plannerResponse && !isStreaming && (
                        <div className="flex justify-end gap-3 pt-4 border-t">
                          {!isEditing ? (
                            <>
                              <Button variant="outline" onClick={handleEditPlan} className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Edit Plan
                              </Button>
                              <Button onClick={handleApprovePlan} className="flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                Approve & Execute
                              </Button>
                            </>
                          ) : (
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={() => setIsEditing(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleSaveEdit} className="flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                Save & Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Edit Mode Overlay */}
                {isEditing && (
                  <div className="absolute inset-0 bg-white z-10 p-4 rounded-lg border">
                    <div className="h-full flex flex-col">
                      <h3 className="text-lg font-semibold mb-4">Edit Remediation Plan</h3>
                      <Textarea
                        value={editedPlan}
                        onChange={(e) => setEditedPlan(e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="Edit your plan here..."
                      />
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} className="flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Save & Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Input Area */}
                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    <Input
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Provide feedback or ask questions about the plan..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!userInput.trim()}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Execution Progress</CardTitle>
                    {executionStatus === 'idle' && (
                      <Button onClick={handleExecutePlan} className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Start Execution
                      </Button>
                    )}
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
