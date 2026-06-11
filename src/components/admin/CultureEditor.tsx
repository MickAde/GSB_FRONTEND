'use client';
import { useEffect } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAdminCulture, updateAdminCulture } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  philosophy:               z.string().default(''),
  mission_statement:        z.string().default(''),
  vision_statement:         z.string().default(''),
  core_values:              z.string().default(''),
  school_creed:             z.string().default(''),
  institutional_principles: z.string().default(''),
  founder_quotes:           z.array(z.object({ quote: z.string(), author: z.string() })).default([]),
});
type Fields = z.infer<typeof schema>;

export function CultureEditor() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminCulture(),
    queryFn:  getAdminCulture,
  });

  const form = useForm<Fields>({ resolver: zodResolver(schema) as Resolver<Fields> });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'founder_quotes' });

  useEffect(() => {
    if (data) form.reset({
      philosophy:               data.philosophy               ?? '',
      mission_statement:        data.mission_statement        ?? '',
      vision_statement:         data.vision_statement         ?? '',
      core_values:              data.core_values              ?? '',
      school_creed:             data.school_creed             ?? '',
      institutional_principles: data.institutional_principles ?? '',
      founder_quotes:           data.founder_quotes           ?? [],
    });
  }, [data, form]);

  const onSubmit = async (values: Fields) => {
    try {
      await updateAdminCulture(values);
      qc.invalidateQueries({ queryKey: queryKeys.adminCulture() });
      toast.success('Culture profile updated successfully.');
    } catch {
      toast.error('Failed to update culture profile.');
    }
  };

  if (isLoading) return <div className="animate-pulse h-64 rounded-xl bg-gray-100" />;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="identity">
        <TabsList>
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="quotes">Founder Quotes</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label>Philosophy</Label>
            <Textarea {...form.register('philosophy')} rows={3} placeholder="The guiding philosophy of your school…" />
          </div>
          <div className="space-y-1">
            <Label>Mission Statement</Label>
            <Textarea {...form.register('mission_statement')} rows={3} />
          </div>
          <div className="space-y-1">
            <Label>Vision Statement</Label>
            <Textarea {...form.register('vision_statement')} rows={3} />
          </div>
          <div className="space-y-1">
            <Label>Core Values</Label>
            <Textarea {...form.register('core_values')} rows={2} placeholder="Integrity, Excellence, Discipline…" />
          </div>
          <div className="space-y-1">
            <Label>School Creed</Label>
            <Textarea {...form.register('school_creed')} rows={3} />
          </div>
          <div className="space-y-1">
            <Label>Institutional Principles</Label>
            <Textarea {...form.register('institutional_principles')} rows={3} placeholder="Core principles guiding institutional decisions…" />
          </div>
        </TabsContent>

        <TabsContent value="quotes" className="mt-4 space-y-4">
          {fields.map((field, i) => (
            <div key={field.id} className="flex gap-3 rounded-lg border p-4">
              <div className="flex-1 space-y-2">
                <div className="space-y-1">
                  <Label>Quote</Label>
                  <Textarea {...form.register(`founder_quotes.${i}.quote`)} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label>Author</Label>
                  <Input {...form.register(`founder_quotes.${i}.author`)} placeholder="Founder name" />
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ quote: '', author: '' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Quote
          </Button>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : 'Save Culture Profile'}
        </Button>
      </div>
    </form>
  );
}
