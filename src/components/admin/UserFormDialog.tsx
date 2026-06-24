'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { createUser, updateUser, getClasses } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import type { UserListItem, UserRole } from '@/types';

const schema = z.object({
  role:             z.string().min(1),
  first_name:       z.string().min(1, 'Required'),
  last_name:        z.string().min(1, 'Required'),
  email:            z.string().optional(),
  username:         z.string().optional(),
  password:         z.string().optional(),
  student_class_id: z.string().optional().nullable(),
});
type Fields = z.infer<typeof schema>;

interface Props {
  open:         boolean;
  onOpenChange: (o: boolean) => void;
  editUser?:    UserListItem | null;
  currentRole:  UserRole | null;
}

export function UserFormDialog({ open, onOpenChange, editUser, currentRole }: Props) {
  const qc   = useQueryClient();
  const form = useForm<Fields>({ resolver: zodResolver(schema) });
  const role = form.watch('role');

  const { data: classes = [] } = useQuery({
    queryKey: queryKeys.adminClasses(),
    queryFn:  getClasses,
    enabled:  open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (editUser) {
      form.reset({
        role:             editUser.role,
        first_name:       editUser.first_name,
        last_name:        editUser.last_name,
        email:            editUser.email    ?? '',
        username:         editUser.username ?? '',
        student_class_id: editUser.student_class_id ?? '',
      });
    } else {
      form.reset({ role: 'STUDENT', student_class_id: '' });
    }
  }, [editUser, form, open]);

  const onSubmit = async (data: Fields) => {
    try {
      const classId = data.student_class_id || null;

      if (editUser) {
        await updateUser(editUser.id, {
          first_name:        data.first_name,
          last_name:         data.last_name,
          student_class_id:  classId,
        });
        toast.success('User updated');
      } else {
        await createUser({
          role:             data.role as 'STUDENT' | 'TEACHER' | 'SUB_ADMIN',
          first_name:       data.first_name,
          last_name:        data.last_name,
          password:         data.password ?? '',
          email:            data.email    || undefined,
          username:         data.username || undefined,
          student_class_id: classId,
        });
        toast.success('User created');
      }
      qc.invalidateQueries({ queryKey: queryKeys.adminUsers.all() });
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const d = e?.response?.data ?? {};
      Object.entries(d).forEach(([field, msgs]) => {
        form.setError(field as keyof Fields, { message: (msgs as string[])[0] });
      });
    }
  };

  const isStudent = role === 'STUDENT';
  const showClass = role === 'STUDENT' || role === 'TEACHER';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {!editUser && (
            <div className="space-y-1">
              <Label>Role</Label>
              <Select
                defaultValue="STUDENT"
                onValueChange={(v) => form.setValue('role', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  {currentRole === 'MAIN_ADMIN' && (
                    <SelectItem value="SUB_ADMIN">Sub-Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>First Name</Label>
              <Input {...form.register('first_name')} />
              {form.formState.errors.first_name && (
                <p className="text-xs text-red-500">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Last Name</Label>
              <Input {...form.register('last_name')} />
              {form.formState.errors.last_name && (
                <p className="text-xs text-red-500">{form.formState.errors.last_name.message}</p>
              )}
            </div>
          </div>

          {!editUser && isStudent && (
            <div className="space-y-1">
              <Label>Admission Number</Label>
              <Input {...form.register('username')} placeholder="ADM/2024/001" />
              {form.formState.errors.username && (
                <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
              )}
            </div>
          )}

          {!editUser && !isStudent && (
            <div className="space-y-1">
              <Label>Email Address</Label>
              <Input type="email" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
          )}

          {/* Class selector — for students and teachers */}
          {showClass && (
            <div className="space-y-1">
              <Label>
                Class{' '}
                <span className="font-normal text-muted-foreground">
                  {isStudent ? '(required)' : '(optional — assigns as class teacher)'}
                </span>
              </Label>
              {classes.length === 0 ? (
                <p className="text-xs text-amber-600">
                  No classes yet. Go to <strong>Classes</strong> to add them first.
                </p>
              ) : (
                <Select
                  value={form.watch('student_class_id') ?? ''}
                  onValueChange={(v) => form.setValue('student_class_id', v === '__none__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— No class —</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {form.formState.errors.student_class_id && (
                <p className="text-xs text-red-500">{form.formState.errors.student_class_id.message}</p>
              )}
            </div>
          )}

          {!editUser && (
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" {...form.register('password')} />
              {form.formState.errors.password && (
                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving…' : editUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
