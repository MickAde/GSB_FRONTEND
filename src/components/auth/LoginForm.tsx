'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/api/auth';
import { setTokens, decodeTokenSync } from '@/lib/token';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

const studentSchema = z.object({ identifier: z.string().min(1, 'Required'), password: z.string().min(1, 'Required') });
const emailSchema   = z.object({ identifier: z.string().email('Enter a valid email'), password: z.string().min(1, 'Required') });

type Fields = z.infer<typeof studentSchema>;

interface Props { schoolId: string }

export function LoginForm({ schoolId }: Props) {
  const [activeRole, setActiveRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setTokens);

  const schema = activeRole === 'STUDENT' ? studentSchema : emailSchema;
  const form   = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    try {
      const roleMap: Record<string, UserRole> = {
        STUDENT: 'STUDENT', TEACHER: 'TEACHER', ADMIN: 'MAIN_ADMIN',
      };
      const payload: Parameters<typeof login>[0] = {
        role:       roleMap[activeRole]!,
        identifier: data.identifier,
        password:   data.password,
        ...(schoolId ? { school_id: schoolId } : {}),
      };
      const tokens  = await login(payload);
      const decoded = decodeTokenSync(tokens.access);
      if (!decoded) throw new Error('Invalid token');
      setTokens(tokens.access, tokens.refresh);
      setAuth(tokens.access, tokens.refresh, decoded);

      const routes: Record<string, string> = {
        STUDENT: '/student/dashboard',
        TEACHER: '/teacher/dashboard',
        MAIN_ADMIN: '/admin/dashboard',
        SUB_ADMIN: '/admin/dashboard',
        VISITOR: '/visitor/dashboard',
      };
      router.push(routes[decoded.role] ?? '/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; error_code?: string } } };
      const code   = e?.response?.data?.error_code;
      const detail = e?.response?.data?.detail ?? 'Login failed. Please try again.';

      if (code === 'INVALID_CREDENTIALS') {
        toast.error('Invalid credentials. Please check and try again.');
      } else if (code === 'ACCOUNT_DISABLED') {
        toast.error('This account has been deactivated. Contact your school admin.');
      } else if (code === 'EMAIL_NOT_VERIFIED') {
        toast.error(detail);
      } else {
        toast.error(detail);
      }
    }
  };

  const tabChange = (val: string) => {
    setActiveRole(val as 'STUDENT' | 'TEACHER' | 'ADMIN');
    form.reset();
  };

  return (
    <Tabs defaultValue="STUDENT" onValueChange={tabChange}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="STUDENT">Student</TabsTrigger>
        <TabsTrigger value="TEACHER">Teacher</TabsTrigger>
        <TabsTrigger value="ADMIN">Admin</TabsTrigger>
      </TabsList>

      {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((tab) => (
        <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor={`identifier-${tab}`}>
                {tab === 'STUDENT' ? 'Admission Number' : 'Email Address'}
              </Label>
              <Input
                id={`identifier-${tab}`}
                type={tab === 'STUDENT' ? 'text' : 'email'}
                placeholder={tab === 'STUDENT' ? 'e.g. ADM/2024/001' : 'name@school.edu.ng'}
                {...form.register('identifier')}
              />
              {form.formState.errors.identifier && (
                <p className="text-xs text-red-500">{form.formState.errors.identifier.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor={`password-${tab}`}>Password</Label>
              <Input
                id={`password-${tab}`}
                type="password"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Logging in…' : `Login as ${tab === 'ADMIN' ? 'Admin' : tab.charAt(0) + tab.slice(1).toLowerCase()}`}
            </Button>
          </form>
        </TabsContent>
      ))}
    </Tabs>
  );
}
