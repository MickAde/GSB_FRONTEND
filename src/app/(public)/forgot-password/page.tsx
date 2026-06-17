import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="pb-2">
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send a reset link.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ForgotPasswordForm />
          <Link href="/login" className="block text-center text-sm text-primary hover:underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
