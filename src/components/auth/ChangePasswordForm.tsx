'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword } from '@/lib/api/auth';

const schema = z
  .object({
    old_password:     z.string().min(1, 'Required'),
    new_password:     z.string().min(8, 'At least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords don't match",
    path:    ['confirm_password'],
  });

type Fields = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const form = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    try {
      await changePassword(data);
      toast.success('Password changed successfully!');
      form.reset();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const d = e?.response?.data ?? {};
      Object.entries(d).forEach(([field, msgs]) => {
        form.setError(field as keyof Fields, { message: (msgs as string[])[0] });
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label>Current Password</Label>
        <Input type="password" {...form.register('old_password')} />
        {form.formState.errors.old_password && (
          <p className="text-xs text-red-500">{form.formState.errors.old_password.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label>New Password</Label>
        <Input type="password" {...form.register('new_password')} />
        {form.formState.errors.new_password && (
          <p className="text-xs text-red-500">{form.formState.errors.new_password.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label>Confirm New Password</Label>
        <Input type="password" {...form.register('confirm_password')} />
        {form.formState.errors.confirm_password && (
          <p className="text-xs text-red-500">{form.formState.errors.confirm_password.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Changing…' : 'Change Password'}
      </Button>
    </form>
  );
}
