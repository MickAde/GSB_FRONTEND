'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { AISummaryCard } from '@/components/notes/AISummaryCard';
import { useNoteDetail } from '@/hooks/useNotes';
import { deleteNote } from '@/lib/api/notes';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, formatFileSize } from '@/lib/utils';

export default function TeacherNoteDetailPage(props: { params: Promise<{ id: string }> }) {
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
      router.push('/teacher/notes');
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
      <Link href="/teacher/notes">
        <Button variant="outline">← Back to Notes</Button>
      </Link>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/teacher/notes">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Notes</Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold break-words text-foreground">{note.file_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <NoteStatusBadge status={note.status} />
            {note.subject && <Badge variant="outline">{note.subject}</Badge>}
            {note.topic   && <Badge variant="outline">{note.topic}</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {note.file_url && (
            <a href={note.file_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" /> Download</Button>
            </a>
          )}
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
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

      {note.status === 'READY'  && <AISummaryCard note={note} />}
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this note?"
        description="This will permanently delete the note and all associated data."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
