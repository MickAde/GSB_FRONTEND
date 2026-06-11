'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getNotes, getSchoolNotes, getNoteDetail } from '@/lib/api/notes';
import type { NoteFilters, SchoolNoteFilters } from '@/types';

export function useNotes(filters?: NoteFilters) {
  return useQuery({
    queryKey: queryKeys.notes.all(filters),
    queryFn:  () => getNotes(filters),
  });
}

export function useSchoolNotes(filters?: SchoolNoteFilters) {
  return useQuery({
    queryKey: queryKeys.notes.school(filters),
    queryFn:  () => getSchoolNotes(filters),
  });
}

export function useNoteDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.notes.detail(id),
    queryFn:  () => getNoteDetail(id),
    enabled:  !!id,
  });
}
