'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getNoteStatus } from '@/lib/api/notes';
import type { NoteStatus } from '@/types';

const TERMINAL_STATES: NoteStatus[] = [
  'READY',
  'FAILED',
  'AWAITING_STUDENT_APPROVAL',
];

export function useNotePoller(noteId: string, initialStatus: NoteStatus) {
  return useQuery({
    queryKey: queryKeys.notes.status(noteId),
    queryFn:  () => getNoteStatus(noteId),
    enabled:  !!noteId,
    refetchInterval: (query) => {
      const status = query.state.data?.status ?? initialStatus;
      return TERMINAL_STATES.includes(status) ? false : 3000;
    },
    refetchIntervalInBackground: false,
  });
}
