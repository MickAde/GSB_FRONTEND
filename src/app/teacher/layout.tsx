'use client';
import { TeacherSidebar } from '@/components/layout/TeacherSidebar';
import { RoleGuard } from '@/components/layout/RoleGuard';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['TEACHER']}>
      <div className="flex min-h-screen bg-background">
        <TeacherSidebar />
        <main className="flex-1 min-w-0 p-4 pb-20 lg:p-10 lg:pb-10">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
