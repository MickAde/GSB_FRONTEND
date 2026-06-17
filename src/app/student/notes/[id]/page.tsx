'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Download, Trash2, AlertTriangle, Loader2, Sparkles, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AISummaryCard } from '@/components/notes/AISummaryCard';
import { useNoteDetail } from '@/hooks/useNotes';
import { deleteNote } from '@/lib/api/notes';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, formatFileSize } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function StudentNoteDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data: note, isLoading, isError } = useNoteDetail(id);
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
