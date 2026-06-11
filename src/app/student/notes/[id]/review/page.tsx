'use client';
import { use } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { OCRReviewEditor } from '@/components/notes/OCRReviewEditor';
import { useNoteDetail } from '@/hooks/useNotes';

export default function NoteReviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data: note, isLoading } = useNoteDetail(id);

  if (isLoading) return <LoadingPage />;
  if (!note) return <p className="p-6 text-red-500">Note not found.</p>;

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
