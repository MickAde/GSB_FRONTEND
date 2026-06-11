'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getActiveSchools } from '@/lib/api/schools';

export function useSchools() {
  return useQuery({
    queryKey: queryKeys.schools.active(),
    queryFn:  getActiveSchools,
  });
}
