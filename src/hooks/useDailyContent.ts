'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getDailyContentToday } from '@/lib/api/notes';
import { useAuthStore } from '@/stores/authStore';

export function useDailyContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.dailyContent.today(),
    queryFn:  getDailyContentToday,
    enabled:  isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });
}
