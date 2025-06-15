
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { getPolicies, PolicyRule } from '@/lib/policy-engine';
import PolicyList from '@/components/policies/PolicyList';
import PolicyEditor from '@/components/policies/PolicyEditor';

const PoliciesPage = () => {
  // In a real application, you'd fetch and update policies via an API.
  // Here we're managing them in client-side state for demonstration.
  const [policies, setPolicies] = React.useState<PolicyRule[]>(getPolicies());
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingPolicy, setEditingPolicy] = React.useState<PolicyRule | undefined>(undefined);

  const handleSavePolicy = (policy: PolicyRule) => {
    if (editingPolicy) {
      setPolicies(policies.map(p => p.id === policy.id ? policy : p));
    } else {
      const newPolicy = { ...policy, id: `policy-${Date.now()}` };
      setPolicies([...policies, newPolicy]);
    }
    setEditingPolicy(undefined);
    setIsEditorOpen(false);
  };
  
  const handleEdit = (policy: PolicyRule) => {
    setEditingPolicy(policy);
    setIsEditorOpen(true);
  }

  const handleAddNew = () => {
    setEditingPolicy(undefined);
    setIsEditorOpen(true);
  }

  const handleDelete = (policyId: string) => {
    setPolicies(policies.filter(p => p.id !== policyId));
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Remediation Policies</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Policy
        </Button>
      </div>
      <div className="mt-6">
        <PolicyList policies={policies} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      <PolicyEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSavePolicy}
        policy={editingPolicy}
      />
    </>
  );
};

export default PoliciesPage;
