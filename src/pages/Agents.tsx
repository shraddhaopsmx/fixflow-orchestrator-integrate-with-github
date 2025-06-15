
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { agents } from "@/lib/mock-data";
import { Settings, Play, Pause, Activity } from "lucide-react";
import IaCRemediationAgent from "@/components/agents/IaCRemediationAgent";
import PipelineRemediationAgent from "@/components/agents/PipelineRemediationAgent";
import RuntimeRemediationAgent from "@/components/agents/RuntimeRemediationAgent";

const Agents = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Inactive': return 'bg-gray-500';
      case 'Error': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">
            Manage and monitor your remediation agents
          </p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Configure Agents
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="iac-agent">IaC Agent</TabsTrigger>
          <TabsTrigger value="pipeline-agent">Pipeline Agent</TabsTrigger>
          <TabsTrigger value="runtime-agent">Runtime Agent</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.name} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <agent.icon className="h-5 w-5" />
                      <CardTitle className="text-lg">{agent.name} Agent</CardTitle>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor('Active')} text-white`}>
                      Active
                    </Badge>
                  </div>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Run:</span>
                    <span>2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span className="text-green-600 font-medium">94%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Issues Fixed:</span>
                    <span className="font-medium">127</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Activity className="h-4 w-4 mr-1" />
                      Logs
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Pause className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="iac-agent">
          <IaCRemediationAgent />
        </TabsContent>
        
        <TabsContent value="pipeline-agent">
          <PipelineRemediationAgent />
        </TabsContent>
        
        <TabsContent value="runtime-agent">
          <RuntimeRemediationAgent />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Overview</CardTitle>
              <CardDescription>
                Monitor the performance and health of your remediation agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">5</div>
                  <div className="text-sm text-muted-foreground">Active Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">342</div>
                  <div className="text-sm text-muted-foreground">Total Fixes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">92%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">1.2h</div>
                  <div className="text-sm text-muted-foreground">Avg MTTR</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Agents;
