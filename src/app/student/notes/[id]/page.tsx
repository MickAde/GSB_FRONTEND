'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Download, Trash2, AlertTriangle, Loader2, Sparkles, Brain, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AISummaryCard } from '@/components/notes/AISummaryCard';
import { useNoteDetail } from '@/hooks/useNotes';
import { deleteNote, getConformityReports } from '@/lib/api/notes';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, formatFileSize, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { ConformityReport } from '@/types';

// ── Conformity score card ─────────────────────────────────────

function ConformityCard({ report }: { report: ConformityReport }) {
  const pct    = report.conformity_percentage ? parseFloat(report.conformity_percentage) : null;
  const isDone = report.status === 'DONE';
  const color  = pct === null ? '#94a3b8' : pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const label  = pct === null ? '—' : pct >= 75 ? 'Excellent' : pct >= 50 ? 'Good' : 'Needs Work';

  const R = 28; const C = 2 * Math.PI * R;
  const dash = isDone && pct !== null ? (pct / 100) * C : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isDone && pct !== null ? (
              <>
                <span className="text-lg font-extrabold tabular-nums" style={{ color }}>{Math.round(pct)}%</span>
              </>
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
              <span
                className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-bold',
                  pct >= 75 ? 'bg-emerald-100 text-emerald-700' :
                  pct >= 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                )}
              >
                {label}
              </span>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-4">
                {report.similarity_analysis}
              </p>
            </>
          ) : report.status === 'PENDING' || report.status === 'PROCESSING' ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Your teacher's reference note is being compared to yours. Check back soon.</span>
            </div>
          ) : report.status === 'FAILED' ? (
            <p className="text-sm text-muted-foreground">Conformity analysis could not be completed.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function NoConformityNote() {
  return (
    <div className="rounded-2xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        <span>No teacher reference note found for this subject yet. Your conformity score will appear automatically once your teacher uploads one.</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function StudentNoteDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data: note, isLoading, isError } = useNoteDetail(id);

  const { data: conformityData } = useQuery({
    queryKey: queryKeys.conformity.forNote(id),
    queryFn:  () => getConformityReports({ student_note: id }),
    enabled:  !!id,
    staleTime: 30_000,
  });
  const conformityReport = conformityData?.results?.[0] ?? null;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const qc     = useQueryClient();
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteNote(id);
      qc.invalidateQueries({ queryKey: queryKeys.notes.all() });
      toast.success('Note deleted');
      router.push('/student/notes');
    } catch { toast.error('Failed to delete note'); }
    finally { setDeleting(false); setConfirmOpen(false); }
  };

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
      <Link href="/student/notes">
        <Button variant="outline">← Back to My Notes</Button>
      </Link>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">

      {/* Back nav */}
      <Link href="/student/notes">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> My Notes
        </Button>
      </Link>

      {/* Title card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl font-bold text-foreground">{note.file_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {note.subject && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {note.subject}
                </span>
              )}
              {note.topic && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {note.topic}
                </span>
              )}
              {note.subtopic && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {note.subtopic}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {note.file_url && (
              <a href={note.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="mr-1 h-4 w-4" /> Download
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        {/* Metadata strip */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-border/50 pt-4">
          {[
            { label: 'Type',     value: note.note_type.toUpperCase() },
            { label: 'Size',     value: formatFileSize(note.file_size_bytes) },
            { label: 'Uploaded', value: formatDate(note.created_at) },
            { label: 'Updated',  value: formatDate(note.updated_at) },
          ].map(({ label, value }) => (
            <div key={label} className="text-xs">
              <span className="text-muted-foreground">{label}: </span>
              <span className="font-semibold text-foreground/80">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content area — depends on status */}
      {note.status === 'READY' ? (
        <div className="space-y-4">
          <AISummaryCard note={note} />
          {/* Conformity score — auto-generated by comparing with teacher's reference */}
          {conformityReport
            ? <ConformityCard report={conformityReport} />
            : note.subject && <NoConformityNote />
          }
          <div className="flex justify-end">
            <Link href={`/student/quiz/generate?note_id=${id}`}>
              <Button className="gap-2">
                <Brain className="h-4 w-4" />
                Generate Quiz
              </Button>
            </Link>
          </div>
        </div>
      ) : note.status === 'AWAITING_STUDENT_APPROVAL' ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h3 className="font-semibold text-amber-900">Review needed before AI can start</h3>
          <p className="mt-1 text-sm text-amber-700">
            Check the extracted text for any errors, then confirm it to generate your study guide.
          </p>
          <Link href={`/student/notes/${id}/review`} className="mt-4 inline-block">
            <Button className="bg-amber-500 text-white hover:bg-amber-600">
              Review OCR Text →
            </Button>
          </Link>
        </div>
      ) : note.status === 'PROCESSING_AI' ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-8 text-center">
          <Sparkles className="mx-auto mb-3 h-10 w-10 animate-pulse text-violet-500" />
          <h3 className="font-semibold text-violet-900">AI is building your study guide…</h3>
          <p className="mt-1 text-sm text-violet-700">This usually takes under a minute. You can leave and come back.</p>
        </div>
      ) : note.status === 'PENDING_OCR' ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-blue-500" />
          <h3 className="font-semibold text-blue-900">Reading your note…</h3>
          <p className="mt-1 text-sm text-blue-700">Extracting text from your file. Large files can take a minute.</p>
        </div>
      ) : note.status === 'FAILED' ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <h3 className="font-semibold text-red-900">Processing failed</h3>
          <p className="mt-1 text-sm text-red-700">{note.error_message || 'Something went wrong.'}</p>
          <Link href={`/student/notes/${id}/review`} className="mt-4 inline-block">
            <Button className="bg-red-500 text-white hover:bg-red-600">
              Edit Text &amp; Retry →
            </Button>
          </Link>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this note?"
        description="This will permanently delete your note and all associated AI summaries."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
