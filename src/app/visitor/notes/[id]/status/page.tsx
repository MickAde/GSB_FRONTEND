'use client';
import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Loader2, ClipboardEdit, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { NoteStatusStepper } from '@/components/notes/NoteStatusStepper';
import { useNotePoller } from '@/hooks/useNotePoller';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Uploaded' },
  { label: 'Extracting Text' },
  { label: 'Review' },
  { label: 'AI Summary' },
  { label: 'Ready' },
];

const statusToStep: Record<string, number> = {
  PENDING_OCR:               1,
  AWAITING_STUDENT_APPROVAL: 2,
  PROCESSING_AI:             3,
  READY:                     4,
  FAILED:                    4,
};

const messages: Record<string, { title: string; description: string }> = {
  PENDING_OCR:               { title: 'Extracting text from your note…',        description: 'Reading your document. Large or scanned files can take up to a minute.' },
  AWAITING_STUDENT_APPROVAL: { title: 'Text extracted — taking you to review…', description: 'Check for any OCR errors before we pass it to AI. Redirecting now.' },
  PROCESSING_AI:             { title: 'AI is generating your summary…',          description: 'Claude is analysing your notes. Usually under a minute.' },
  READY:                     { title: 'Your summary is ready!',                  description: 'All done. Taking you to your summary now.' },
  FAILED:                    { title: 'Processing failed',                       description: 'Something went wrong. See the error below, or try uploading again.' },
};

export default function VisitorNoteStatusPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router  = useRouter();
  const { data } = useNotePoller(id, 'PENDING_OCR');

  const status      = data?.status ?? 'PENDING_OCR';
  const msg         = messages[status] ?? messages.PENDING_OCR;
  const currentStep = statusToStep[status] ?? 0;
  const isFailed    = status === 'FAILED';

  useEffect(() => {
    if (status === 'AWAITING_STUDENT_APPROVAL') {
      const t = setTimeout(() => router.push(`/visitor/notes/${id}/review`), 1500);
      return () => clearTimeout(t);
    }
    if (status === 'READY') {
      const t = setTimeout(() => router.push(`/visitor/notes/${id}`), 2000);
      return () => clearTimeout(t);
    }
  }, [status, id, router]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center space-y-8 pt-10">

      {/* Step progress */}
      <NoteStatusStepper steps={STEPS} currentStep={currentStep} failed={isFailed} />

      {/* Status icon */}
      <div className={cn(
        'flex h-20 w-20 items-center justify-center rounded-full transition-all',
        status === 'READY'                     && 'bg-green-50',
        isFailed                               && 'bg-red-50',
        status === 'AWAITING_STUDENT_APPROVAL' && 'bg-amber-50',
        (status === 'PENDING_OCR' || status === 'PROCESSING_AI') && 'bg-primary/10',
      )}>
        {status === 'PENDING_OCR'              && <Loader2       className="h-10 w-10 animate-spin text-primary" />}
        {status === 'AWAITING_STUDENT_APPROVAL' && <ClipboardEdit className="h-10 w-10 text-amber-500" />}
        {status === 'PROCESSING_AI'            && <Sparkles      className="h-10 w-10 animate-pulse text-primary" />}
        {status === 'READY'                    && <CheckCircle   className="h-10 w-10 text-green-500" />}
        {isFailed                              && <AlertTriangle className="h-10 w-10 text-red-500" />}
      </div>

      {/* Message */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">{msg.title}</h1>
        <p className="text-muted-foreground">{msg.description}</p>
        {data?.error_message && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{data.error_message}</p>
        )}
      </div>

      <NoteStatusBadge status={status} />

      {status === 'AWAITING_STUDENT_APPROVAL' && (
        <Link href={`/visitor/notes/${id}/review`}>
          <Button className="bg-amber-500 text-white hover:bg-amber-600">Review Text →</Button>
        </Link>
      )}
      {status === 'READY' && (
        <Link href={`/visitor/notes/${id}`}>
          <Button className="bg-green-600 hover:bg-green-700">View Summary →</Button>
        </Link>
      )}
      {isFailed && (
        <div className="flex flex-col items-center gap-3 w-full">
          <Link href={`/visitor/notes/${id}/review`} className="w-full">
            <Button className="w-full bg-amber-500 text-white hover:bg-amber-600">Edit Text &amp; Retry AI →</Button>
          </Link>
          <Link href="/visitor/notes/upload" className="w-full">
            <Button variant="outline" className="w-full">Upload a Different Note</Button>
          </Link>
        </div>
      )}
      <Link href="/visitor/notes" className="text-sm text-primary hover:underline">← Back to My Notes</Link>
    </div>
  );
}
