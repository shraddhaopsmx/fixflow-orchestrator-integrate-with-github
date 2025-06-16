
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertTriangle, GitPullRequest } from "lucide-react";
import { AutoFixResult } from "@/types/workflow";

interface AutoFixResultDisplayProps {
  result: AutoFixResult;
}

const AutoFixResultDisplay: React.FC<AutoFixResultDisplayProps> = ({ result }) => {
  const getStatusIcon = () => {
    switch (result.status) {
      case 'COMPLETED_AUTOMATIC':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'AWAITING_APPROVAL':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = () => {
    switch (result.status) {
      case 'COMPLETED_AUTOMATIC':
        return 'default';
      case 'AWAITING_APPROVAL':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitPullRequest className="h-5 w-5" />
          AutoFix Workflow Result
        </CardTitle>
        <CardDescription>{result.decision}</CardDescription>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <Badge variant={getStatusBadgeVariant()}>
            Status: {result.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="context">Context</TabsTrigger>
            <TabsTrigger value="llm">LLM Response</TabsTrigger>
            <TabsTrigger value="mcp">MCP Action</TabsTrigger>
            <TabsTrigger value="log">Audit Log</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Workflow ID:</p>
                  <p className="text-muted-foreground font-mono">{result.workflowId}</p>
                </div>
                <div>
                  <p className="font-medium">Issue ID:</p>
                  <p className="text-muted-foreground">{result.issueId}</p>
                </div>
              </div>
              
              {result.status === 'AWAITING_APPROVAL' && result.approvalPayload && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Manual Approval Required</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">The following fix requires manual review and approval:</p>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                      <code>{JSON.stringify(result.approvalPayload, null, 2)}</code>
                    </pre>
                  </CardContent>
                </Card>
              )}
              
              {result.status === 'COMPLETED_AUTOMATIC' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    ✅ This issue was automatically remediated and changes were applied.
                  </p>
                </div>
              )}
              
              {result.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">❌ Error: {result.error}</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="context" className="mt-4">
            {result.context ? (
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-sm mb-2">Application Context:</p>
                  <div className="bg-muted p-4 rounded-md text-sm">
                    <p><strong>Name:</strong> {result.context.application.name}</p>
                    <p><strong>Structure:</strong> {result.context.application.structure}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">Code Ownership:</p>
                  <div className="bg-muted p-4 rounded-md text-sm">
                    <p><strong>Team:</strong> {result.context.ownership.team}</p>
                    <p><strong>Owner:</strong> {result.context.ownership.owner}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">Git Repository:</p>
                  <div className="bg-muted p-4 rounded-md text-sm">
                    <p><strong>URL:</strong> {result.context.git.repoUrl}</p>
                    <p><strong>Recent Commits:</strong></p>
                    <ul className="list-disc list-inside ml-2">
                      {result.context.git.commitHistory.map((commit, index) => (
                        <li key={index}>{commit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No context data available.</p>
            )}
          </TabsContent>
          
          <TabsContent value="llm" className="mt-4">
            {result.llmResponse ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm"><strong>Confidence Score:</strong> {result.llmResponse.confidence.toFixed(1)}%</p>
                  <Badge variant={result.llmResponse.confidence >= 90 ? 'default' : 'secondary'}>
                    {result.llmResponse.confidence >= 90 ? 'High Confidence' : 'Low Confidence'}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">LLM Rationale:</p>
                  <div className="bg-muted p-4 rounded-md text-sm">
                    <p className="whitespace-pre-wrap">{result.llmResponse.rationale}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">Proposed Fix:</p>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                    <code>{result.llmResponse.proposedFix}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No LLM response available.</p>
            )}
          </TabsContent>
          
          <TabsContent value="mcp" className="mt-4">
            {result.mcpResponse ? (
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-sm mb-2">MCP Job Status:</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.mcpResponse.status === 'SUCCESS' ? 'default' : 'destructive'}>
                      {result.mcpResponse.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Job ID: {result.mcpResponse.jobId}</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">MCP Response Details:</p>
                  <div className="bg-muted p-4 rounded-md text-sm">
                    <p>{result.mcpResponse.details}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No MCP action was taken for this issue.</p>
            )}
          </TabsContent>
          
          <TabsContent value="log" className="mt-4">
            <div>
              <p className="font-medium text-sm mb-4">Complete Audit Log:</p>
              <div className="space-y-4 font-mono text-xs bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                {result.auditLog.map((entry, index) => (
                  <div key={index}>
                    <p className="text-muted-foreground">{entry.timestamp}</p>
                    <p><span className="font-semibold">[{entry.actor}]</span> - {entry.action}</p>
                    <pre className="mt-1 p-2 bg-background rounded-md overflow-x-auto">
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AutoFixResultDisplay;
