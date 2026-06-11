'use client';
import { VisitorSidebar } from '@/components/layout/VisitorSidebar';
import { RoleGuard } from '@/components/layout/RoleGuard';

export default function VisitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['VISITOR']}>
      <div className="flex min-h-screen bg-background">
        <VisitorSidebar />
        <main className="flex-1 min-w-0 p-6 pt-20 lg:p-10">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
