'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerVisitor, resendVerification } from '@/lib/api/auth';

const schema = z
  .object({
    first_name: z.string().min(1, 'Required'),
    last_name:  z.string().min(1, 'Required'),
    email:      z.string().email('Enter a valid email'),
    password:   z.string().min(8, 'At least 8 characters'),
    confirm:    z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path:    ['confirm'],
  });

type Fields = z.infer<typeof schema>;

export function VisitorRegisterForm() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  const form = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    try {
      await registerVisitor({
        email:      data.email,
        password:   data.password,
        first_name: data.first_name,
        last_name:  data.last_name,
      });
      setEmail(data.email);
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const d = e?.response?.data ?? {};
      Object.entries(d).forEach(([field, msgs]) => {
        form.setError(field as keyof Fields, { message: (msgs as string[])[0] });
      });
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification(email);
      toast.success('Verification email resent!');
    } catch {
      toast.error('Could not resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="rounded-full bg-green-100 p-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Check your inbox!</h2>
        <p className="text-sm text-muted-foreground">We&apos;ve sent a verification link to <strong>{email}</strong></p>
        <p className="text-xs text-muted-foreground">The link expires in 24 hours.</p>
        <Button variant="outline" onClick={handleResend} disabled={resending}>
          {resending ? 'Resending…' : 'Resend verification email'}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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

      <div className="space-y-1">
        <Label>Email Address</Label>
        <Input type="email" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label>Password</Label>
        <Input type="password" {...form.register('password')} />
        {form.formState.errors.password && (
          <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label>Confirm Password</Label>
        <Input type="password" {...form.register('confirm')} />
        {form.formState.errors.confirm && (
          <p className="text-xs text-red-500">{form.formState.errors.confirm.message}</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Your account includes a 1-week free trial.</p>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Creating account…' : 'Create Account'}
      </Button>
    </form>
  );
}
