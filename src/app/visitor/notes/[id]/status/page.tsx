'use client';
import { use } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Loader2, ClipboardEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { useNotePoller } from '@/hooks/useNotePoller';

const messages: Record<string, { title: string; description: string }> = {
  PENDING_OCR:               { title: 'Extracting text…',       description: 'Reading your note. Usually 15–30 seconds.' },
  AWAITING_STUDENT_APPROVAL: { title: 'Review needed',          description: 'Please review and correct the extracted text.' },
  PROCESSING_AI:             { title: 'Generating summary…',    description: 'AI is analysing your note. Up to a minute.' },
  READY:                     { title: 'Your summary is ready!', description: 'Click below to see your AI summary.' },
  FAILED:                    { title: 'Processing failed',      description: 'Something went wrong. Please try again.' },
};

export default function VisitorNoteStatusPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data } = useNotePoller(id, 'PENDING_OCR');

  const status     = data?.status ?? 'PENDING_OCR';
  const msg        = messages[status] ?? messages.PENDING_OCR;
  const isTerminal = ['READY', 'FAILED', 'AWAITING_STUDENT_APPROVAL'].includes(status);

  return (
    <div className="flex max-w-lg flex-col items-center space-y-6 pt-10">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
        {status === 'READY'        && <CheckCircle className="h-10 w-10 text-green-500" />}
        {status === 'FAILED'       && <AlertTriangle className="h-10 w-10 text-red-500" />}
        {status === 'AWAITING_STUDENT_APPROVAL' && <ClipboardEdit className="h-10 w-10 text-amber-500" />}
        {!isTerminal && <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />}
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{msg.title}</h1>
        <p className="mt-2 text-gray-500">{msg.description}</p>
        {data?.error_message && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{data.error_message}</p>
        )}
      </div>
      <NoteStatusBadge status={status} />
      {status === 'READY'  && (
        <Link href={`/visitor/notes/${id}`}>
          <Button className="bg-indigo-600 hover:bg-indigo-700">View Summary →</Button>
        </Link>
      )}
      {status === 'AWAITING_STUDENT_APPROVAL' && (
        <Link href={`/visitor/notes/${id}/review`}>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white">Review OCR Text →</Button>
        </Link>
      )}
      {status === 'FAILED' && (
        <Link href="/visitor/notes/upload">
          <Button variant="outline">Try Again</Button>
        </Link>
      )}
      <Link href="/visitor/notes" className="text-sm text-indigo-600 hover:underline">← Back to My Notes</Link>
    </div>
  );
}
