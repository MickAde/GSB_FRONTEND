'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { confirmOCR } from '@/lib/api/notes';

const DRAFT_KEY = (id: string) => `ocr_draft_${id}`;
const AUTO_SAVE_MS = 10_000;

interface Props { noteId: string; rawText: string; basePath: string }

export function OCRReviewEditor({ noteId, rawText, basePath }: Props) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY(noteId));
    setText(draft ?? rawText ?? '');
  }, [noteId, rawText]);

  // Auto-save every 10 seconds
  useEffect(() => {
    timerRef.current = setInterval(() => {
      localStorage.setItem(DRAFT_KEY(noteId), text);
    }, AUTO_SAVE_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [noteId, text]);

  // Warn before navigate away if edits exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (text !== rawText) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [text, rawText]);

  const handleConfirm = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 10) {
      setError('Text must be at least 10 characters.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await confirmOCR(noteId, trimmed);
      localStorage.removeItem(DRAFT_KEY(noteId));
      router.push(`${basePath}/${noteId}/status`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail ?? 'Confirmation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={20}
        className="font-mono text-sm leading-relaxed"
        placeholder="OCR text will appear here. Correct any errors before confirming."
      />
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{charCount} chars · {wordCount} words</span>
        <span className="text-gray-300">Auto-saved every 10 s</span>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>← Back</Button>
        <Button
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? 'Confirming…' : 'Confirm & Generate Summary →'}
        </Button>
      </div>
    </div>
  );
}
