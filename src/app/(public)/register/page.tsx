import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VisitorRegisterForm } from '@/components/auth/VisitorRegisterForm';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="pb-2">
          <h1 className="text-2xl font-bold text-gray-900">Create Visitor Account</h1>
          <p className="text-sm text-gray-500">Start your 1-week free trial today</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <VisitorRegisterForm />
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:underline">
              Login as Visitor
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
