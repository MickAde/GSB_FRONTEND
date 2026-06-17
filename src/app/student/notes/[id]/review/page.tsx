'use client';
import { use } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { OCRReviewEditor } from '@/components/notes/OCRReviewEditor';
import { useNoteDetail } from '@/hooks/useNotes';

export default function NoteReviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data: note, isLoading, isError } = useNoteDetail(id);

  if (isLoading) return <LoadingPage />;

  if (isError || !note) {
    return (
      <div className="flex max-w-md flex-col items-center gap-5 pt-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Note not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This note may have been deleted or you may not have permission to access it.
          </p>
        </div>
        <Link href="/student/notes">
          <Button variant="outline">← Back to My Notes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title="Review Extracted Text"
        description="Check the OCR output below. Correct any errors before we generate your AI summary."
      />
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Read through the extracted text carefully. Fix any misread characters, missing words, or formatting issues. Then click Confirm.
      </div>
      <OCRReviewEditor noteId={id} rawText={note.raw_ocr_text} basePath="/student/notes" />
    </div>
  );
}
