'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';
import { LoadingPage } from '@/components/common/LoadingSpinner';

interface Props {
  allowedRoles: UserRole[];
  children:     React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: Props) {
  const { isAuthenticated, role, isStaff } = useAuthStore();
  const router = useRouter();

  // Start false (matches server render where Zustand has no localStorage).
  // Set true only after Zustand's persist layer has finished reading storage.
  // For synchronous localStorage this resolves immediately in useEffect.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    // Async storage fallback
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  // Only redirect after Zustand has confirmed the auth state.
  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace('/');
      return;
    }
    if (role && !allowedRoles.includes(role) && !isStaff) {
      router.replace('/');
    }
  }, [hydrated, isAuthenticated, role, isStaff, allowedRoles, router]);

  if (!hydrated || !isAuthenticated) return <LoadingPage />;
  if (role && !allowedRoles.includes(role) && !isStaff) return <LoadingPage />;

  return <>{children}</>;
}
