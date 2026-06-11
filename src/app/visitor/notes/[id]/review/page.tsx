'use client';
import { use } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { OCRReviewEditor } from '@/components/notes/OCRReviewEditor';
import { useNoteDetail } from '@/hooks/useNotes';

export default function VisitorNoteReviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data: note, isLoading } = useNoteDetail(id);

  if (isLoading) return <LoadingPage />;
  if (!note) return <p className="p-6 text-red-500">Note not found.</p>;

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title="Review Extracted Text"
        description="Correct any OCR errors before generating your AI summary."
      />
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Fix any misread words or characters, then click Confirm to generate your summary.
      </div>
      <OCRReviewEditor noteId={id} rawText={note.raw_ocr_text} basePath="/visitor/notes" />
    </div>
  );
}
