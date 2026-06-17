'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPasswordReset } from '@/lib/api/auth';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type Fields  = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    try { await requestPasswordReset(data.email); } catch {}
    setSent(true);
  };

  if (sent) {
    return (
      <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
        If an account with that email exists, a reset link has been sent. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label>Email Address</Label>
        <Input type="email" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Sendingâ€¦' : 'Send reset link'}
      </Button>
    </form>
  );
}
