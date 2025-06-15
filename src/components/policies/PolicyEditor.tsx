import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PolicyRule } from "@/lib/policy-rules";
import { MultiSelect } from "@/components/ui/multi-select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const policySchema = z.object({
  name: z.string().min(1, { message: "Policy name is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  enabled: z.boolean().default(true),
  conditions: z.object({
    source: z.array(z.string()).default([]),
    severity: z.array(z.string()).default([]),
  }),
  decision: z.object({
    autoRemediate: z.boolean().default(false),
    requiresApproval: z.boolean().default(true),
  }),
});

type PolicyFormValues = z.infer<typeof policySchema>;

interface PolicyEditorProps {
  policy?: PolicyRule;
  onSave: (policy: PolicyRule) => void;
  onCancel: () => void;
}

const severityOptions = [
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
  { label: "Info", value: "info" },
];

const sourceOptions = [
  { label: "Snyk", value: "snyk" },
  { label: "Sonatype", value: "sonatype" },
  { label: "GitHub", value: "github" },
];

export function PolicyEditor({ policy, onSave, onCancel }: PolicyEditorProps) {
  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      name: policy?.name || "",
      description: policy?.description || "",
      enabled: policy?.enabled ?? true,
      conditions: {
        source: policy?.conditions?.source || [],
        severity: policy?.conditions?.severity || [],
      },
      decision: {
        autoRemediate: policy?.decision?.autoRemediate ?? false,
        requiresApproval: policy?.decision?.requiresApproval ?? true,
      },
    },
  });

  function onSubmit(values: PolicyFormValues) {
    const policyRule: PolicyRule = {
      id: policy?.id || crypto.randomUUID(),
      name: values.name,
      description: values.description,
      enabled: values.enabled,
      conditions: {
        source: values.conditions.source,
        severity: values.conditions.severity,
      },
      decision: {
        autoRemediate: values.decision.autoRemediate,
        requiresApproval: values.decision.requiresApproval,
      },
    };
    onSave(policyRule);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{policy ? "Edit Policy" : "Create New Policy"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Auto-fix critical Python vulns" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe what this policy does..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Enabled</FormLabel>
                    <FormDescription>
                      Enable or disable this policy.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />
            <h3 className="text-lg font-medium">Conditions</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="conditions.severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <MultiSelect
                      options={severityOptions}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder="Any severity"
                    />
                    <FormDescription>Apply if issue has one of these severities. Empty means all.</FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="conditions.source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <MultiSelect
                      options={sourceOptions}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder="Any source"
                    />
                    <FormDescription>Apply if issue comes from one of these sources. Empty means all.</FormDescription>
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            <h3 className="text-lg font-medium">Decision</h3>
            <div className="space-y-4">
               <FormField
                  control={form.control}
                  name="decision.autoRemediate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Auto-remediate</FormLabel>
                         <FormDescription>
                          Automatically apply the fix if confidence is high.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="decision.requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Requires Approval</FormLabel>
                        <FormDescription>
                          Create an approval request for a human to review.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
            </div>

          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Save Policy</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
