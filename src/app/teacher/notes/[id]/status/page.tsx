'use client';
import { use } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { useNotePoller } from '@/hooks/useNotePoller';

const messages: Record<string, { title: string; description: string }> = {
  PENDING_OCR:    { title: 'Extracting text…',    description: 'OCR is running on your note. Usually takes 15–30 seconds.' },
  PROCESSING_AI:  { title: 'Generating summary…', description: 'AI is analysing your note. This can take up to a minute.' },
  READY:          { title: 'Note is ready!',       description: 'Your note has been processed and is ready to use in conformity reports.' },
  FAILED:         { title: 'Processing failed',    description: 'Something went wrong processing your note.' },
};

export default function TeacherNoteStatusPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data } = useNotePoller(id, 'PENDING_OCR');

  const status     = data?.status ?? 'PENDING_OCR';
  const msg        = messages[status] ?? messages.PENDING_OCR;
  const isTerminal = ['READY', 'FAILED'].includes(status);

  return (
    <div className="flex max-w-lg flex-col items-center space-y-6 pt-10">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
        {status === 'READY'  && <CheckCircle className="h-10 w-10 text-green-500" />}
        {status === 'FAILED' && <AlertTriangle className="h-10 w-10 text-red-500" />}
        {!isTerminal         && <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />}
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{msg.title}</h1>
        <p className="mt-2 text-gray-500">{msg.description}</p>
        {data?.error_message && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{data.error_message}</p>
        )}
      </div>
      <NoteStatusBadge status={status} />
      {status === 'READY' && (
        <Link href={`/teacher/notes/${id}`}>
          <Button className="bg-indigo-600 hover:bg-indigo-700">View Note →</Button>
        </Link>
      )}
      {status === 'FAILED' && (
        <Link href="/teacher/notes/upload">
          <Button variant="outline">Try Again</Button>
        </Link>
      )}
      <Link href="/teacher/notes" className="text-sm text-indigo-600 hover:underline">← Back to My Notes</Link>
    </div>
  );
}
