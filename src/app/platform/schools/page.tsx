'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getPlatformSchools, createSchool, updateSchool, deleteSchool } from '@/lib/api/platform';
import { queryKeys } from '@/lib/query-keys';
import { slugify, formatDate } from '@/lib/utils';
import type { SchoolAdmin } from '@/types';

const schema = z.object({
  name:          z.string().min(1, 'Required'),
  slug:          z.string().min(1, 'Required'),
  logo_url:      z.string().optional(),
  address:       z.string().optional(),
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
});
type Fields = z.infer<typeof schema>;

export default function PlatformSchoolsPage() {
  const qc = useQueryClient();
  const [open, setOpen]             = useState(false);
  const [editSchool, setEditSchool] = useState<SchoolAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.platformSchools(),
    queryFn:  getPlatformSchools,
  });

  const form = useForm<Fields>({ resolver: zodResolver(schema) });
  const nameVal = form.watch('name');

  const openCreate = () => { setEditSchool(null); form.reset(); setOpen(true); };
  const openEdit   = (s: SchoolAdmin) => {
    setEditSchool(s);
    form.reset({ name: s.name, slug: s.slug, logo_url: s.logo_url, address: s.address, contact_email: s.contact_email, contact_phone: s.contact_phone });
    setOpen(true);
  };

  const onSubmit = async (data: Fields) => {
    try {
      if (editSchool) {
        await updateSchool(editSchool.id, data);
        toast.success('School updated');
      } else {
        await createSchool(data as import('@/types').CreateSchoolPayload);
        toast.success('School onboarded');
      }
      qc.invalidateQueries({ queryKey: queryKeys.platformSchools() });
      setOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      Object.entries(e?.response?.data ?? {}).forEach(([f, msgs]) => {
        form.setError(f as keyof Fields, { message: (msgs as string[])[0] });
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSchool(deleteTarget.id);
      qc.invalidateQueries({ queryKey: queryKeys.platformSchools() });
      toast.success('School deactivated');
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  const toggleActive = async (school: SchoolAdmin) => {
    try {
      await updateSchool(school.id, { is_active: !school.is_active });
      qc.invalidateQueries({ queryKey: queryKeys.platformSchools() });
      toast.success(`School ${school.is_active ? 'deactivated' : 'activated'}`);
    } catch { toast.error('Failed to update status'); }
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Platform Schools"
        actions={
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Onboard School
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Onboarding Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((school) => (
              <TableRow key={school.id}>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell className="font-mono text-xs">{school.slug}</TableCell>
                <TableCell>
                  <button onClick={() => toggleActive(school)}>
                    <Badge className={school.is_active ? 'bg-green-100 text-green-700 border-0' : 'bg-red-100 text-red-700 border-0'}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell>{formatDate(school.onboarding_date)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(school)}>Edit</Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(school)}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editSchool ? 'Edit School' : 'Onboard New School'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1">
              <Label>School Name</Label>
              <Input
                {...form.register('name')}
                onChange={(e) => {
                  form.setValue('name', e.target.value);
                  if (!editSchool) form.setValue('slug', slugify(e.target.value));
                }}
              />
              {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input {...form.register('slug')} className="font-mono" />
              {form.formState.errors.slug && <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Logo URL</Label>
              <Input {...form.register('logo_url')} />
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input {...form.register('address')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Contact Email</Label>
                <Input type="email" {...form.register('contact_email')} />
              </div>
              <div className="space-y-1">
                <Label>Contact Phone</Label>
                <Input {...form.register('contact_phone')} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Savingâ€¦' : editSchool ? 'Save Changes' : 'Onboard School'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Deactivate school?"
        description="This will prevent all school users from logging in."
        confirmLabel="Deactivate"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
