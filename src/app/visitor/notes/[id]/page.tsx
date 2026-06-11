'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Download, Trash2 } from 'lucide-react';
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

export default function VisitorNoteDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data: note, isLoading } = useNoteDetail(id);
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
      router.push('/visitor/notes');
    } catch { toast.error('Failed to delete note'); }
    finally { setDeleting(false); setConfirmOpen(false); }
  };

  if (isLoading) return <LoadingPage />;
  if (!note)     return <p className="p-6 text-red-500">Note not found.</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/visitor/notes">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Notes</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold break-words text-gray-900">{note.file_name}</h1>
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
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-medium text-gray-800">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {note.status === 'READY' ? (
        <AISummaryCard note={note} />
      ) : note.status === 'AWAITING_STUDENT_APPROVAL' ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-amber-600 font-medium">Review required before summary generation.</p>
            <Link href={`/visitor/notes/${id}/review`}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white">Review OCR Text →</Button>
            </Link>
          </CardContent>
        </Card>
      ) : note.status === 'FAILED' ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-red-600">{note.error_message || 'Processing failed.'}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-gray-400">Processing…</CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this note?"
        description="This will permanently delete your note and all AI summaries."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
