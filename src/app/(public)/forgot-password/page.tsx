import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="pb-2">
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="text-sm text-gray-500">Enter your email and we&apos;ll send a reset link.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ForgotPasswordForm />
          <Link href="/login" className="block text-center text-sm text-indigo-600 hover:underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
