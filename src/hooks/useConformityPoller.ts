'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getConformityStatus } from '@/lib/api/notes';
import type { ConformityStatus } from '@/types';

const TERMINAL: ConformityStatus[] = ['DONE', 'FAILED'];

export function useConformityPoller(reportId: string) {
  return useQuery({
    queryKey: queryKeys.conformity.status(reportId),
    queryFn:  () => getConformityStatus(reportId),
    enabled:  !!reportId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL.includes(status) ? false : 4000;
    },
  });
}
