'use client';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Download, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { AISummaryCard } from '@/components/notes/AISummaryCard';
import { useQuery } from '@tanstack/react-query';
import { getSchoolNoteDetail, getConformityReports } from '@/lib/api/notes';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, formatFileSize, cn } from '@/lib/utils';
import type { ConformityReport } from '@/types';

// ── Conformity score card (teacher view) ─────────────────────

function ConformityCard({ report }: { report: ConformityReport }) {
  const pct    = report.conformity_percentage ? parseFloat(report.conformity_percentage) : null;
  const isDone = report.status === 'DONE';
  const color  = pct === null ? '#94a3b8' : pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const label  = pct === null ? '—' : pct >= 75 ? 'Excellent' : pct >= 50 ? 'Good' : 'Needs Work';

  const R = 28; const C = 2 * Math.PI * R;
  const dash = isDone && pct !== null ? (pct / 100) * C : 0;

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="mb-4 text-sm font-bold text-foreground">Conformity Score</p>
        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
              <circle cx="36" cy="36" r={R} fill="none" strokeWidth="7" className="stroke-muted/40" />
              <circle
                cx="36" cy="36" r={R} fill="none"
                stroke={color} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${dash} ${C}`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {isDone && pct !== null ? (
                <span className="text-lg font-extrabold tabular-nums" style={{ color }}>{Math.round(pct)}%</span>
              ) : report.status === 'FAILED' ? (
                <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            {isDone && pct !== null ? (
              <>
                <span className={cn(
                  'inline-block rounded-full px-2.5 py-0.5 text-xs font-bold',
                  pct >= 75 ? 'bg-emerald-100 text-emerald-700' :
                  pct >= 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700',
                )}>
                  {label}
                </span>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-4">
                  {report.similarity_analysis}
                </p>
              </>
            ) : report.status === 'PENDING' || report.status === 'PROCESSING' ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Comparing this note against your reference… check back shortly.</span>
              </div>
            ) : report.status === 'FAILED' ? (
              <p className="text-sm text-muted-foreground">Conformity analysis could not be completed.</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function SchoolNoteDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);

  const { data: note, isLoading, isError } = useQuery({
    queryKey: queryKeys.notes.schoolDetail(id),
    queryFn:  () => getSchoolNoteDetail(id),
    enabled:  !!id,
  });

  const { data: conformityData } = useQuery({
    queryKey: queryKeys.conformity.forNote(id),
    queryFn:  () => getConformityReports({ student_note: id }),
    enabled:  !!note && note.status === 'READY',
    staleTime: 30_000,
  });
  const conformityReport = conformityData?.results?.[0] ?? null;

  if (isLoading) return <LoadingPage />;
  if (isError || !note) return (
    <div className="flex max-w-md flex-col items-center gap-5 pt-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">Note not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This note may have been deleted or you don&apos;t have permission to access it.
        </p>
      </div>
      <Link href="/teacher/notes/school">
        <Button variant="outline">← Back to Class Notes</Button>
      </Link>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/teacher/notes/school">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Class Notes</Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold break-words text-foreground">{note.file_name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">by {note.owner_name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <NoteStatusBadge status={note.status} />
            {note.subject && <Badge variant="outline">{note.subject}</Badge>}
            {note.topic   && <Badge variant="outline">{note.topic}</Badge>}
          </div>
        </div>
        {note.file_url && (
          <a href={note.file_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" /> Download</Button>
          </a>
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-3 pt-4 text-sm sm:grid-cols-4">
          {[
            { label: 'Type',     value: note.note_type.toUpperCase() },
            { label: 'Size',     value: formatFileSize(note.file_size_bytes) },
            { label: 'Uploaded', value: formatDate(note.created_at) },
            { label: 'Updated',  value: formatDate(note.updated_at) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium text-foreground">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {note.status === 'READY' && (
        <>
          <AISummaryCard note={note} />
          {conformityReport && <ConformityCard report={conformityReport} />}
        </>
      )}
      {note.status === 'FAILED' && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-red-600">{note.error_message || 'Processing failed.'}</p>
          </CardContent>
        </Card>
      )}
      {!['READY', 'FAILED'].includes(note.status) && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">Processing…</CardContent>
        </Card>
      )}
    </div>
  );
}
