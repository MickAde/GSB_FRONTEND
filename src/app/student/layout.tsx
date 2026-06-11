'use client';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { RoleGuard } from '@/components/layout/RoleGuard';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="flex min-h-screen bg-background">
        <StudentSidebar />
        <main className="flex-1 min-w-0 p-6 pt-20 lg:p-10">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
