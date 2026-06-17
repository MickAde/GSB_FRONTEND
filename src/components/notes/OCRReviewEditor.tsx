'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { confirmOCR } from '@/lib/api/notes';
import { queryKeys } from '@/lib/query-keys';
import { Info, Save } from 'lucide-react';

const DRAFT_KEY = (id: string) => `ocr_draft_${id}`;
const AUTO_SAVE_MS = 10_000;

interface Props { noteId: string; rawText: string; basePath: string }

export function OCRReviewEditor({ noteId, rawText, basePath }: Props) {
  const router = useRouter();
  const qc     = useQueryClient();
  const [text, setText]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved]   = useState<Date | null>(null);
  const [error, setError]           = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY(noteId));
    setText(draft ?? rawText ?? '');
  }, [noteId, rawText]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      localStorage.setItem(DRAFT_KEY(noteId), text);
      setLastSaved(new Date());
    }, AUTO_SAVE_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [noteId, text]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (text !== rawText) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [text, rawText]);

  const handleConfirm = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 10) { setError('Text must be at least 10 characters.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await confirmOCR(noteId, trimmed);
      localStorage.removeItem(DRAFT_KEY(noteId));
      // Clear the stale status cache so the status page polls fresh (not stale AWAITING_STUDENT_APPROVAL)
      qc.removeQueries({ queryKey: queryKeys.notes.status(noteId) });
      router.push(`${basePath}/${noteId}/status`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const detail = e?.response?.data?.detail ?? '';
      // Backend rejected because the note already moved past review â€” send user forward
      if (detail.includes('PROCESSING_AI') || detail.includes('READY')) {
        qc.removeQueries({ queryKey: queryKeys.notes.status(noteId) });
        router.push(`${basePath}/${noteId}/status`);
        return;
      }
      toast.error(detail || 'Confirmation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  return (
    <div className="space-y-4">

      {/* Instructions banner */}
      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <div>
          <strong>What to check:</strong> look for jumbled words, missing spaces, or characters that don&apos;t make sense.
          Fix any errors so the AI can understand your notes correctly â€” then click <em>Confirm</em>.
        </div>
      </div>

      {/* Editor */}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={20}
        className="font-mono text-sm leading-relaxed"
        placeholder="The extracted text from your note will appear here. Fix any errors before confirming."
      />

      {/* Stats + auto-save indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{charCount.toLocaleString()} chars Â· {wordCount.toLocaleString()} words</span>
        <span className="flex items-center gap-1">
          <Save className="h-3 w-3" />
          {lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Auto-saves every 10 s'}
        </span>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>â† Back</Button>
        <Button
          className="flex-1 bg-primary hover:bg-primary/90"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? 'Confirmingâ€¦' : 'Confirm & Generate Study Guide â†’'}
        </Button>
      </div>
    </div>
  );
}
