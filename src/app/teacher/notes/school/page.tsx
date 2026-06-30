'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { useSchoolNotes } from '@/hooks/useNotes';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getConformityReports } from '@/lib/api/notes';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, cn } from '@/lib/utils';
import type { NoteStatus, ConformityReport } from '@/types';

const STATUS_OPTIONS: { value: NoteStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',                    label: 'All Statuses' },
  { value: 'PENDING_OCR',            label: 'Pending OCR' },
  { value: 'AWAITING_STUDENT_APPROVAL', label: 'Awaiting Review' },
  { value: 'PROCESSING_AI',          label: 'Processing AI' },
  { value: 'READY',                  label: 'Ready' },
  { value: 'FAILED',                 label: 'Failed' },
];

function ConformityBadge({ pct, status }: { pct: string | null; status: ConformityReport['status'] }) {
  if (status === 'PENDING' || status === 'PROCESSING') {
    return <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Grading…</span>;
  }
  if (status === 'FAILED' || pct === null) return null;
  const n = parseFloat(pct);
  return (
    <span className={cn(
      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
      n >= 75 ? 'bg-emerald-100 text-emerald-700' :
      n >= 50 ? 'bg-amber-100 text-amber-700' :
               'bg-rose-100 text-rose-700',
    )}>
      {Math.round(n)}% conform.
    </span>
  );
}

export default function SchoolNotesPage() {
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: user }  = useCurrentUser();

  // Fetch all conformity reports for the class in one request so each card
  // can show a conformity badge without N+1 queries.
  const { data: conformityData } = useQuery({
    queryKey: queryKeys.conformity.all(),
    queryFn:  () => getConformityReports(),
    staleTime: 60_000,
  });
  const conformityByNoteId = Object.fromEntries(
    (conformityData?.results ?? []).map((r) => [r.student_note_id, r])
  );

  const { data, isLoading } = useSchoolNotes(
    statusFilter !== 'ALL' ? { status: statusFilter as NoteStatus } : undefined
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
        title={user?.student_class_name ? `${user.student_class_name} Notes` : 'Class Notes'}
        description={`${data?.count ?? 0} notes from your class${user?.student_class_name ? ` — ${user.student_class_name}` : ''}`}
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
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          No notes found.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((note) => {
            const conformity = conformityByNoteId[note.id];
            return (
              <Link key={note.id} href={`/teacher/notes/school/${note.id}`}>
                <Card className="overflow-hidden hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{note.file_name}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>by {note.owner_name}</span>
                        {note.subject && <span>· {note.subject}</span>}
                        {note.topic   && <span>· {note.topic}</span>}
                        <span>· {formatDate(note.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {conformity && (
                        <ConformityBadge
                          pct={conformity.conformity_percentage}
                          status={conformity.status}
                        />
                      )}
                      <NoteStatusBadge status={note.status} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
