'use client';
import { useState } from 'react';
import { Copy, Check, BookOpen, Target, Star, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { NoteDetail } from '@/types';

interface Props { note: NoteDetail }

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}

export function AISummaryCard({ note }: Props) {
  return (
    <div className="space-y-4">

      {/* Header banner */}
      <div className="flex items-center gap-3 rounded-2xl gradient-primary px-5 py-4 text-white shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl">
          ✨
        </div>
        <div>
          <p className="text-xs font-medium text-white/70">Genius Study Buddy</p>
          <h2 className="text-lg font-bold leading-tight">Your AI Study Guide</h2>
        </div>
      </div>

      {/* Summary paragraph */}
      {note.ai_summary_paragraph && (
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/30">
          <div className="flex items-center justify-between border-b border-blue-100 px-4 py-3 dark:border-blue-900/40">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
              <BookOpen className="h-4 w-4" />
              Summary
            </div>
            <CopyButton text={note.ai_summary_paragraph} />
          </div>
          <div className="px-4 py-4">
            <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-200">{note.ai_summary_paragraph}</p>
          </div>
        </div>
      )}

      {/* Key bullet points — numbered */}
      {note.ai_bullet_points?.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="h-4 w-4 text-primary" />
              Key Points
            </div>
            <CopyButton text={note.ai_bullet_points.join('\n')} />
          </div>
          <div className="divide-y divide-border px-4 pb-2">
            {note.ai_bullet_points.map((point, i) => (
              <div key={i} className="flex gap-3 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-foreground/80">{point}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Must-remember — flashcard grid */}
      {note.ai_key_points?.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="flex items-center justify-between border-b border-amber-100 px-4 py-3 dark:border-amber-900/40">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Must Remember
            </div>
            <CopyButton text={note.ai_key_points.join('\n')} />
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            {note.ai_key_points.map((pt, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl border border-amber-200 bg-card px-3 py-2.5 shadow-sm dark:border-amber-900/40"
              >
                <span className="mt-0.5 text-sm">⭐</span>
                <p className="text-sm font-medium leading-snug text-foreground">{pt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivational footer */}
      <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-center dark:border-green-900/40 dark:bg-green-950/30">
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          Great work! 💪 Review these points before your next test or exam.
        </p>
      </div>

      {/* Raw OCR text — collapsible */}
      {note.raw_ocr_text && (
        <Accordion type="single" collapsible>
          <AccordionItem value="ocr" className="rounded-xl border border-border px-4">
            <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Original Extracted Text
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-4 font-mono text-xs leading-relaxed text-muted-foreground">
                {note.raw_ocr_text}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
