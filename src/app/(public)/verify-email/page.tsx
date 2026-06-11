'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { verifyEmail, resendVerification } from '@/lib/api/auth';
import { setTokens, decodeTokenSync } from '@/lib/token';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

type Status = 'loading' | 'success' | 'expired' | 'invalid';

export default function VerifyEmailPage(props: { searchParams: Promise<{ token?: string }> }) {
  const searchParams = use(props.searchParams);
  const token  = searchParams.token ?? '';
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setTokens);
  const [status, setStatus]   = useState<Status>('loading');
  const [email, setEmail]     = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    verifyEmail(token)
      .then((data) => {
        const decoded = decodeTokenSync(data.access);
        if (!decoded) { setStatus('invalid'); return; }
        setTokens(data.access, data.refresh);
        setAuth(data.access, data.refresh, decoded);
        setStatus('success');
        setTimeout(() => router.push('/visitor/dashboard'), 1500);
      })
      .catch((err: unknown) => {
        const code = (err as { response?: { data?: { error_code?: string } } })?.response?.data?.error_code;
        setStatus(code === 'TOKEN_EXPIRED' ? 'expired' : 'invalid');
      });
  }, [token, router, setAuth]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await resendVerification(email);
      toast.success('Verification email sent!');
    } catch {
      toast.error('Failed to resend. Try again.');
    } finally { setResending(false); }
  };

  if (status === 'loading') return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-500">Verifying your email…</p>
      </div>
    </main>
  );

  if (status === 'success') return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
        <h1 className="text-xl font-bold text-gray-900">Email verified!</h1>
        <p className="mt-1 text-gray-500">Redirecting to your dashboard…</p>
      </div>
    </main>
  );

  if (status === 'expired') return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <XCircle className="mx-auto mb-4 h-16 w-16 text-amber-500" />
        <h1 className="text-xl font-bold text-gray-900">Verification link expired</h1>
        <p className="mt-1 mb-6 text-gray-500">Enter your email to receive a new link.</p>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Email Address</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleResend} disabled={resending || !email}>
            {resending ? 'Sending…' : 'Resend verification email'}
          </Button>
        </div>
      </div>
    </main>
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h1 className="text-xl font-bold text-gray-900">Invalid verification link</h1>
        <p className="mt-1 text-gray-500">This link is not valid.</p>
        <Link href="/register" className="mt-4 inline-block text-indigo-600 hover:underline">
          Back to registration
        </Link>
      </div>
    </main>
  );
}
