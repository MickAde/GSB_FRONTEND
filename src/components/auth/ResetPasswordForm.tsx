'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { confirmPasswordReset } from '@/lib/api/auth';
import { toast } from 'sonner';

const schema = z
  .object({
    new_password:     z.string().min(8, 'At least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords don't match",
    path:    ['confirm_password'],
  });

type Fields = z.infer<typeof schema>;

interface Props { uid: string; token: string }

export function ResetPasswordForm({ uid, token }: Props) {
  const router  = useRouter();
  const [done, setDone] = useState(false);
  const form    = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    try {
      await confirmPasswordReset({ uid, token, ...data });
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error_code?: string; detail?: string } } };
      if (e?.response?.data?.error_code === 'INVALID_RESET_LINK') {
        toast.error('This reset link is invalid or has expired.');
      } else {
        toast.error(e?.response?.data?.detail ?? 'Reset failed. Please try again.');
      }
    }
  };

  if (done) {
    return (
      <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
        Password reset successfully! Redirecting to login…
      </p>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label>New Password</Label>
        <Input type="password" {...form.register('new_password')} />
        {form.formState.errors.new_password && (
          <p className="text-xs text-red-500">{form.formState.errors.new_password.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label>Confirm Password</Label>
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
        {form.formState.isSubmitting ? 'Resetting…' : 'Reset Password'}
      </Button>
    </form>
  );
}
