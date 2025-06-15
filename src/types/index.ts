
import { LucideIcon } from "lucide-react";

export type Risk = {
  id: string;
  title: string;
  agent: 'Code' | 'IaC' | 'Pipeline' | 'Cloud' | 'Runtime';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Fixed';
  timestamp: string;
  resource: string;
};

export type Agent = {
    name: 'Code' | 'IaC' | 'Pipeline' | 'Cloud' | 'Runtime' | 'Orchestrator';
    icon: LucideIcon;
    description: string;
}
