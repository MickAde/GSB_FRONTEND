'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlatformSidebar } from '@/components/layout/PlatformSidebar';
import { useAuthStore } from '@/stores/authStore';
import { LoadingPage } from '@/components/common/LoadingSpinner';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isStaff } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !isStaff) router.replace('/');
  }, [isAuthenticated, isStaff, router]);

  if (!isAuthenticated || !isStaff) return <LoadingPage />;

  return (
    <div className="flex min-h-screen bg-background">
      <PlatformSidebar />
      <main className="flex-1 min-w-0 p-6 pt-20 lg:p-10">
        {children}
      </main>
    </div>
  );
}
