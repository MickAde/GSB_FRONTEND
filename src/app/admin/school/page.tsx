'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getAdminSchool, updateAdminSchool } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  name:          z.string().min(1, 'Required'),
  logo_url:      z.string().optional(),
  address:       z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
});
type Fields = z.infer<typeof schema>;

export default function AdminSchoolPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminSchool(),
    queryFn:  getAdminSchool,
  });

  const form = useForm<Fields>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) form.reset({
      name:          data.name,
      logo_url:      data.logo_url,
      address:       data.address,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
    });
  }, [data, form]);

  const onSubmit = async (values: Fields) => {
    try {
      await updateAdminSchool(values);
      qc.invalidateQueries({ queryKey: queryKeys.adminSchool() });
      toast.success('School info updated successfully.');
      setEditing(false);
    } catch {
      toast.error('Failed to update school info.');
    }
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="School Information"
        actions={
          !editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>School Name</Label>
              <Input {...form.register('name')} disabled={!editing} />
              {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Logo URL</Label>
              <Input {...form.register('logo_url')} disabled={!editing} placeholder="https://…" />
              {form.watch('logo_url') && (
                <img src={form.watch('logo_url')} alt="Logo preview" className="mt-2 h-16 w-16 rounded-full object-cover" />
              )}
            </div>

            <div className="space-y-1">
              <Label>Address</Label>
              <Textarea {...form.register('address')} disabled={!editing} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Contact Email</Label>
                <Input type="email" {...form.register('contact_email')} disabled={!editing} />
                {form.formState.errors.contact_email && <p className="text-xs text-red-500">{form.formState.errors.contact_email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Contact Phone</Label>
                <Input {...form.register('contact_phone')} disabled={!editing} />
              </div>
            </div>

            {/* Read-only fields */}
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-1">
              <p><strong>Slug:</strong> {data?.slug}</p>
              <p><strong>Active:</strong> {data?.is_active ? 'Yes' : 'No'}</p>
              <p><strong>Onboarding Date:</strong> {data?.onboarding_date}</p>
              <p className="text-xs mt-2">Contact platform support to change these settings.</p>
            </div>

            {editing && (
              <div className="flex gap-3">
                <Button variant="outline" type="button" onClick={() => { setEditing(false); form.reset(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
