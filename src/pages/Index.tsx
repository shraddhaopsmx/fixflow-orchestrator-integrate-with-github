
import DashboardCard from "@/components/dashboard/DashboardCard";
import RiskTable from "@/components/dashboard/RiskTable";
import RiskTrendChart from "@/components/dashboard/RiskTrendChart";
import { agents, risks } from "@/lib/mock-data";
import { Code, Cloud, FileCode, CloudUpload, Shield, Folder, FolderCode } from "lucide-react";

const Index = () => {
    const openRisks = risks.filter(r => r.status === 'Open' || r.status === 'In Progress');
    const criticalRisks = openRisks.filter(r => r.severity === 'Critical').length;
    const fixedLast30Days = risks.filter(r => r.status === 'Fixed').length; // Simplified

    const agentIcons: Record<string, React.FC<any>> = {
        Code,
        IaC: FileCode,
        Pipeline: CloudUpload,
        Cloud,
        Runtime: Shield
    };

  return (
    <>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <DashboardCard title="Open Risks" value={openRisks.length.toString()} icon={Folder} change="+2 this week" changeType="increase"/>
            <DashboardCard title="Critical Risks" value={criticalRisks.toString()} icon={Shield} change="+1 this week" changeType="increase"/>
            <DashboardCard title="Fixed (30d)" value={fixedLast30Days.toString()} icon={Code} change="-5 this week" changeType="decrease"/>
            <DashboardCard title="Agents Active" value={agents.length.toString()} icon={FolderCode} change="" changeType="neutral"/>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
             <RiskTable risks={openRisks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())} />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
            <RiskTrendChart risks={risks} />
        </div>
    </>
  );
};

export default Index;
