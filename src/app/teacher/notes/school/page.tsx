'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { useSchoolNotes } from '@/hooks/useNotes';
import { formatDate } from '@/lib/utils';
import type { NoteStatus } from '@/types';

const STATUS_OPTIONS: { value: NoteStatus | ''; label: string }[] = [
  { value: '',                       label: 'All Statuses' },
  { value: 'PENDING_OCR',            label: 'Pending OCR' },
  { value: 'AWAITING_STUDENT_APPROVAL', label: 'Awaiting Review' },
  { value: 'PROCESSING_AI',          label: 'Processing AI' },
  { value: 'READY',                  label: 'Ready' },
  { value: 'FAILED',                 label: 'Failed' },
];

export default function SchoolNotesPage() {
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useSchoolNotes(
    statusFilter ? { status: statusFilter as NoteStatus } : undefined
  );

  const notes = data?.results ?? [];
  const filtered = search
    ? notes.filter(
        (n) =>
          n.file_name.toLowerCase().includes(search.toLowerCase()) ||
          n.owner_name.toLowerCase().includes(search.toLowerCase()) ||
          n.subject?.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-5xl space-y-5">
      <PageHeader
        title="School Notes"
        description={`${data?.count ?? 0} notes across the school`}
      />

      <div className="flex gap-3">
        <Input
          placeholder="Search by name, owner, subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-gray-400">
          No notes found.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((note) => (
            <Card key={note.id} className="overflow-hidden hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{note.file_name}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
                    <span>by {note.owner_name}</span>
                    {note.subject && <span>· {note.subject}</span>}
                    {note.topic   && <span>· {note.topic}</span>}
                    <span>· {formatDate(note.created_at)}</span>
                  </div>
                </div>
                <NoteStatusBadge status={note.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
