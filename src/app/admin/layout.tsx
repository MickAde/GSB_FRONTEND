'use client';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { RoleGuard } from '@/components/layout/RoleGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['MAIN_ADMIN', 'SUB_ADMIN']}>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 min-w-0 p-4 pb-20 lg:p-10 lg:pb-10">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
