'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getMe } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn:  getMe,
    enabled:  isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
