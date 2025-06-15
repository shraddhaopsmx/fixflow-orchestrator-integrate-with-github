
import { AutoFixResult } from "@/types/workflow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const WorkflowAuditLog = ({ log }: { log: AutoFixResult['auditLog'] }) => (
    <div className="space-y-4 font-mono text-xs bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
      {log.map((entry, index) => (
        <div key={index}>
          <p className="text-muted-foreground">{entry.timestamp}</p>
          <p><span className="font-semibold">[{entry.actor}]</span> - {entry.action}</p>
          <pre className="mt-1 p-2 bg-background rounded-md overflow-x-auto">
            {JSON.stringify(entry.details, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );

const AutoFixResultDisplay = ({ autoFixResult }: { autoFixResult: AutoFixResult | null }) => {
    if (!autoFixResult) return null;

    return (
        <Card>
            <CardHeader>
              <CardTitle>Auto-Fix Workflow Result</CardTitle>
              <CardDescription>{autoFixResult.decision}</CardDescription>
              <Badge variant={
                  autoFixResult.status === 'COMPLETED_AUTOMATIC' ? 'default'
                  : autoFixResult.status === 'AWAITING_APPROVAL' ? 'secondary'
                  : 'destructive'
              }>
                  Status: {autoFixResult.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="llm">LLM Details</TabsTrigger>
                  <TabsTrigger value="mcp">MCP Response</TabsTrigger>
                  <TabsTrigger value="log">Audit Log</TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="mt-4">
                  {autoFixResult.status === 'AWAITING_APPROVAL' && autoFixResult.approvalPayload && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">Approval Required</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-sm mb-2">The following fix requires manual approval:</p>
                        <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                          <code>{JSON.stringify(autoFixResult.approvalPayload, null, 2)}</code>
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                  {autoFixResult.status === 'COMPLETED_AUTOMATIC' && autoFixResult.mcpResponse && (
                     <Card>
                     <CardHeader><CardTitle className="text-base">Remediation Applied</CardTitle></CardHeader>
                     <CardContent>
                       <p className="text-sm mb-2">The fix was applied automatically via MCP.</p>
                       <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                         <code>{JSON.stringify(autoFixResult.mcpResponse, null, 2)}</code>
                       </pre>
                     </CardContent>
                   </Card>
                  )}
                   {autoFixResult.status === 'FAILED' && (
                    <p className="text-sm text-red-500">Workflow failed: {autoFixResult.error}</p>
                  )}
                </TabsContent>
                <TabsContent value="llm" className="mt-4">
                  {autoFixResult.llmResponse ? (
                    <div className="space-y-4">
                      <p className="text-sm"><strong>Confidence:</strong> {autoFixResult.llmResponse.confidence.toFixed(2)}%</p>
                      <div>
                        <p className="font-medium text-sm">Rationale:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{autoFixResult.llmResponse.rationale}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Proposed Fix:</p>
                        <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm"><code>{autoFixResult.llmResponse.proposedFix}</code></pre>
                      </div>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No LLM response available.</p>}
                </TabsContent>
                <TabsContent value="mcp" className="mt-4">
                  {autoFixResult.mcpResponse ? (
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm"><code>{JSON.stringify(autoFixResult.mcpResponse, null, 2)}</code></pre>
                  ) : <p className="text-sm text-muted-foreground">No MCP action was taken.</p>}
                </TabsContent>
                <TabsContent value="log" className="mt-4">
                  <WorkflowAuditLog log={autoFixResult.auditLog} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
    );
};

export default AutoFixResultDisplay;
