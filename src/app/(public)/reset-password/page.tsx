import { use } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage(props: { searchParams: Promise<{ uid?: string; token?: string }> }) {
  const searchParams = use(props.searchParams);
  const uid   = searchParams.uid   ?? '';
  const token = searchParams.token ?? '';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="pb-2">
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm uid={uid} token={token} />
        </CardContent>
      </Card>
    </main>
  );
}
