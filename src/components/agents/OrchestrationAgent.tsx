
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayCircle, ShieldCheck, CheckCircle, Clock, GitPullRequest, AlertCircle, Rocket } from "lucide-react";
import { orchestrationService } from '@/lib/orchestration-service';
import { orchestrationIssues } from '@/lib/orchestration-test-data';
import { FinalReport, LifecycleLogEntry } from '@/types/orchestration';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const OrchestrationAgent = () => {
  const [logs, setLogs] = useState<LifecycleLogEntry[]>([]);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRunSimulation = async () => {
    setIsLoading(true);
    setLogs([]);
    setReport(null);
    toast({ title: "Orchestration Simulation Started", description: "Processing issues across all agents..." });

    const { logs: finalLogs, report: finalReport } = await orchestrationService.runSimulation(orchestrationIssues);

    setLogs(finalLogs);
    setReport(finalReport);
    setIsLoading(false);
    toast({ title: "Orchestration Simulation Complete", description: `Processed ${finalReport.totalIssues} issues.` });
  };

  const getIconForStep = (step: LifecycleLogEntry['step']) => {
    switch (step) {
      case 'Received': return <Rocket className="h-4 w-4 text-blue-500" />;
      case 'Routed': return <GitPullRequest className="h-4 w-4 text-purple-500" />;
      case 'Agent Executed': return <ShieldCheck className="h-4 w-4 text-indigo-500" />;
      case 'Pending Approval': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Approved':
      case 'Fix Applied':
      case 'Completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> Remediation Orchestrator
          </CardTitle>
          <CardDescription>
            Run a full, end-to-end remediation lifecycle simulation across all available security agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRunSimulation} disabled={isLoading}>
            <PlayCircle className="mr-2 h-4 w-4" />
            {isLoading ? 'Simulation in Progress...' : 'Run Full Lifecycle Simulation'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lifecycle Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full pr-4">
              <div className="space-y-4">
                {logs.length > 0 ? logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {getIconForStep(log.step)}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{log.step}: <span className="text-muted-foreground">{log.message}</span></p>
                      <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()} - {log.issueId}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p>Simulation logs will appear here.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Final Report</CardTitle>
          </CardHeader>
          <CardContent>
            {report ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Total Issues:</span> <Badge>{report.totalIssues}</Badge></div>
                <div className="flex justify-between"><span>Auto-Remediated:</span> <Badge variant="secondary" className="bg-green-100 text-green-800">{report.remediatedAutomatically}</Badge></div>
                <div className="flex justify-between"><span>Needs Approval:</span> <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{report.remediatedWithApproval}</Badge></div>
                <div className="flex justify-between"><span>Failed:</span> <Badge variant={report.failed > 0 ? "destructive" : "secondary"}>{report.failed}</Badge></div>
                <div className="flex justify-between"><span>Avg. MTTR:</span> <span>{(report.averageTimeToRemediateMs / 1000).toFixed(2)}s</span></div>
                <div className="flex justify-between"><span>Risk Reduction:</span> <span className="font-bold text-green-600">{report.riskReductionScore}</span></div>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Report will be generated after simulation.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrchestrationAgent;
