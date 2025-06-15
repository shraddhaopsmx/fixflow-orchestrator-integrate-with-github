
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PolicyRule } from '@/lib/policy-engine';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';

const policySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional(),
  enabled: z.boolean(),
  conditions: z.object({
    severity: z.array(z.string()).optional(),
    source: z.array(z.string()).optional(),
  }),
  decision: z.object({
    autoRemediate: z.boolean(),
  }),
});

type PolicyFormValues = z.infer<typeof policySchema>;

interface PolicyEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policy: PolicyRule) => void;
  policy?: PolicyRule;
}

const severityOptions = ['Critical', 'High', 'Medium', 'Low'];
const sourceOptions = ['SAST', 'IaC', 'Pipeline', 'CSPM'];

const PolicyEditor: React.FC<PolicyEditorProps> = ({ isOpen, onClose, onSave, policy }) => {
  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: policy ? {
      ...policy,
      decision: { autoRemediate: policy.decision.autoRemediate }
    } : {
      name: '',
      description: '',
      enabled: true,
      conditions: { severity: [], source: [] },
      decision: { autoRemediate: false },
    },
  });

  React.useEffect(() => {
    form.reset(policy ? {
      ...policy,
      decision: { autoRemediate: policy.decision.autoRemediate }
    } : {
      name: '',
      description: '',
      enabled: true,
      conditions: { severity: [], source: [] },
      decision: { autoRemediate: false },
    });
  }, [policy, form]);

  const onSubmit = (values: PolicyFormValues) => {
    const finalPolicy: PolicyRule = {
      id: policy?.id || '',
      ...values,
      description: values.description || '',
      decision: {
        autoRemediate: values.decision.autoRemediate,
        requiresApproval: !values.decision.autoRemediate,
      },
    };
    onSave(finalPolicy);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{policy ? 'Edit Policy' : 'Create New Policy'}</DialogTitle>
          <DialogDescription>Define the conditions and actions for this remediation policy.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Name</FormLabel>
                <FormControl><Input placeholder="e.g., Auto-remediate low-severity IaC" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="A brief description of what this policy does." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <Card className="p-4 bg-muted/50">
              <h3 className="text-md font-semibold mb-4">Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="conditions.severity" render={() => (
                  <FormItem>
                    <div className="mb-2"><FormLabel>Severity</FormLabel></div>
                    {severityOptions.map((item) => (<FormField key={item} control={form.control} name="conditions.severity" render={({ field }) => (
                      <FormItem key={item} className="flex flex-row items-center space-x-3 space-y-0 mb-2">
                        <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                          return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((v) => v !== item))
                        }} /></FormControl>
                        <FormLabel className="font-normal">{item}</FormLabel>
                      </FormItem>)} />))}
                  </FormItem>)} />
                <FormField control={form.control} name="conditions.source" render={() => (
                  <FormItem>
                    <div className="mb-2"><FormLabel>Source (Agent)</FormLabel></div>
                    {sourceOptions.map((item) => (<FormField key={item} control={form.control} name="conditions.source" render={({ field }) => (
                      <FormItem key={item} className="flex flex-row items-center space-x-3 space-y-0 mb-2">
                        <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                          return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((v) => v !== item))
                        }} /></FormControl>
                        <FormLabel className="font-normal">{item}</FormLabel>
                      </FormItem>)} />))}
                  </FormItem>)} />
              </div>
              <FormDescription className="mt-4">If no conditions are selected, the policy will apply to all issues (acting as a default).</FormDescription>
            </Card>

            <Card className="p-4 bg-muted/50">
              <h3 className="text-md font-semibold mb-2">Action</h3>
              <FormField control={form.control} name="decision.autoRemediate" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup onValueChange={(val) => field.onChange(val === 'true')} value={String(field.value)} className="space-y-2">
                      <FormItem className="flex items-center space-x-3"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Auto-Remediate</FormLabel></FormItem>
                      <FormItem className="flex items-center space-x-3"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Manual Approval</FormLabel></FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>)} />
            </Card>
            
            <FormField control={form.control} name="enabled" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5"><FormLabel>Enable Policy</FormLabel><FormDescription>If disabled, this policy will be ignored.</FormDescription></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>)} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Policy</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyEditor;
