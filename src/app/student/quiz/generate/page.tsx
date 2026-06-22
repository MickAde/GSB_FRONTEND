'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Brain, ArrowLeft, Settings, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getNotes } from '@/lib/api/notes';
import { createQuiz, getQuizPreferences, getSubjectLimits } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import type { QuizDifficulty, SubjectLimits } from '@/types';

const DIFF_ORDER: Record<QuizDifficulty, number> = { easy: 1, moderate: 2, difficult: 3 };
const DIFF_LABELS: Record<QuizDifficulty, string> = { easy: 'Easy', moderate: 'Moderate', difficult: 'Difficult' };

export default function GenerateQuizPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [noteId,     setNoteId]     = useState(searchParams.get('note_id') ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = searchParams.get('note_id');
    if (id) setNoteId(id);
  }, [searchParams]);

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: queryKeys.notes.all({ status: 'READY' }),
    queryFn:  () => getNotes({ status: 'READY' }),
  });

  const { data: prefs, isLoading: prefsLoading } = useQuery({
    queryKey: queryKeys.quiz.preferences(),
    queryFn:  getQuizPreferences,
    staleTime: 60_000,
  });

  const { data: allLimits } = useQuery({
    queryKey: queryKeys.quiz.subjectLimits(),
    queryFn:  () => getSubjectLimits(),
  });

  if (notesLoading || prefsLoading) return <LoadingPage />;

  const readyNotes  = notes?.results ?? [];
  const numQ        = prefs?.num_questions ?? 10;
  const difficulty  = prefs?.difficulty    ?? 'moderate';

  // Find the selected note to check subject threshold
  const selectedNote = readyNotes.find((n) => n.id === noteId);
  const subject      = selectedNote?.subject ?? '';
  const limitsArr    = Array.isArray(allLimits) ? (allLimits as SubjectLimits[]) : [];
  const subjectLimit = subject ? limitsArr.find((l) => l.subject.toLowerCase() === subject.toLowerCase()) : null;

  const blocked =
    subjectLimit &&
    (numQ < subjectLimit.min_questions || DIFF_ORDER[difficulty] < DIFF_ORDER[subjectLimit.min_difficulty]);

  const handleGenerate = async () => {
    if (!noteId) { toast.error('Please select a note.'); return; }
    setSubmitting(true);
    try {
      const res = await createQuiz({ note_id: noteId, difficulty, num_questions: numQ });
      toast.success('Quiz is being generated…');
      router.push(`/student/quiz/${res.quiz_id}/status`);
    } catch (err: unknown) {
      // Surface backend threshold errors explicitly
      const detail =
        (err as { response?: { data?: { num_questions?: string[]; difficulty?: string[] } } })
          ?.response?.data;
      if (detail?.num_questions) {
        toast.error(detail.num_questions[0]);
      } else if (detail?.difficulty) {
        toast.error(detail.difficulty[0]);
      } else {
        toast.error('Failed to start quiz generation. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <Link href="/student/quiz">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> My Quizzes
        </Button>
      </Link>

      <PageHeader
        title="Generate a Quiz"
        description="Select a note — AI will build your quiz using your saved settings."
      />

      {/* Saved settings summary */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Using: </span>
          <span className="font-semibold text-foreground">
            {numQ} questions · {DIFF_LABELS[difficulty]}
          </span>
        </div>
        <Link href="/student/settings">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5 h-7">
            <Settings className="h-3.5 w-3.5" />
            Update in Settings
          </Button>
        </Link>
      </div>

      {/* Note selector */}
      <div className="space-y-2">
        {readyNotes.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You don&apos;t have any processed notes yet.{' '}
            <Link href="/student/notes/upload" className="font-semibold underline">Upload a note</Link> first.
          </div>
        ) : (
          <Select value={noteId} onValueChange={setNoteId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Choose a note…" />
            </SelectTrigger>
            <SelectContent>
              {readyNotes.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.file_name}{n.subject ? ` · ${n.subject}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Threshold warning for the selected subject */}
      {blocked && subjectLimit && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Teacher requirement not met for {subject}</p>
            <p className="mt-0.5">
              Your teacher requires at least{' '}
              <strong>{subjectLimit.min_questions} questions</strong> at{' '}
              <strong>{DIFF_LABELS[subjectLimit.min_difficulty]} or higher</strong>.
            </p>
            <Link href="/student/settings" className="mt-1.5 inline-block font-semibold underline">
              Update Quiz Settings →
            </Link>
          </div>
        </div>
      )}

      <Button
        className="w-full gradient-primary rounded-xl font-bold text-white shadow-md shadow-primary/25 hover:opacity-90 h-12"
        disabled={!noteId || submitting || readyNotes.length === 0 || !!blocked}
        onClick={handleGenerate}
      >
        {submitting ? (
          <span className="flex items-center gap-2"><Brain className="h-4 w-4 animate-pulse" /> Generating…</span>
        ) : (
          <span className="flex items-center gap-2"><Brain className="h-4 w-4" /> Generate {numQ} Questions →</span>
        )}
      </Button>
    </div>
  );
}
