'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Upload, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { UserTable } from '@/components/admin/UserTable';
import { UserFormDialog } from '@/components/admin/UserFormDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { getUsers, setUserPassword } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/authStore';
import type { UserListItem } from '@/types';

const pwSchema = z.object({ new_password: z.string().min(8), confirm_password: z.string() })
  .refine((d) => d.new_password === d.confirm_password, { message: "Passwords don't match", path: ['confirm_password'] });
type PwFields = z.infer<typeof pwSchema>;

export default function AdminUsersPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const role = useAuthStore((s) => s.role);
  const qc   = useQueryClient();
  const [search, setSearch]   = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [pwUser, setPwUser]   = useState<UserListItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminUsers.all({ search }),
    queryFn:  () => getUsers({ search: search || undefined }),
  });

  const pwForm = useForm<PwFields>({ resolver: zodResolver(pwSchema) });

  const onSetPassword = async (data: PwFields) => {
    if (!pwUser) return;
    try {
      await setUserPassword(pwUser.id, data);
      toast.success('Password updated');
      setPwUser(null);
      pwForm.reset();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      Object.entries(e?.response?.data ?? {}).forEach(([f, msgs]) => {
        pwForm.setError(f as keyof PwFields, { message: (msgs as string[])[0] });
      });
    }
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-6xl space-y-4">
      <PageHeader
        title="User Management"
        actions={
          <>
            <Link href="/admin/users/import">
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Import Students</Button>
            </Link>
            <Button onClick={() => { setEditUser(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />Add User
            </Button>
          </>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {data?.results?.length ? (
        <UserTable
          users={data.results}
          currentRole={mounted ? role : null}
          onEdit={(u) => { setEditUser(u); setFormOpen(true); }}
          onSetPassword={(u) => { setPwUser(u); pwForm.reset(); }}
          onView={(u) => { setEditUser(u); setFormOpen(true); }}
        />
      ) : (
        <EmptyState
          title="No users found"
          description="Add users or import students to get started."
          action={{ label: 'Add User', onClick: () => setFormOpen(true) }}
        />
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editUser={editUser}
        currentRole={role}
      />

      {/* Set password dialog */}
      <Dialog open={!!pwUser} onOpenChange={(o) => !o && setPwUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Password — {pwUser?.first_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={pwForm.handleSubmit(onSetPassword)} className="space-y-4">
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input type="password" {...pwForm.register('new_password')} />
              {pwForm.formState.errors.new_password && <p className="text-xs text-red-500">{pwForm.formState.errors.new_password.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <Input type="password" {...pwForm.register('confirm_password')} />
              {pwForm.formState.errors.confirm_password && <p className="text-xs text-red-500">{pwForm.formState.errors.confirm_password.message}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setPwUser(null)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={pwForm.formState.isSubmitting}>
                {pwForm.formState.isSubmitting ? 'Saving…' : 'Set Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
