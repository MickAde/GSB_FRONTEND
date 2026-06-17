'use client';
import { VisitorSidebar } from '@/components/layout/VisitorSidebar';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { TrialExpiryBanner } from '@/components/layout/TrialExpiryBanner';

export default function VisitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['VISITOR']}>
      <div className="flex min-h-screen bg-background">
        <VisitorSidebar />
        <div className="flex flex-1 min-w-0 flex-col">
          <TrialExpiryBanner />
          <main className="flex-1 p-4 pb-20 lg:p-10 lg:pb-10">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
