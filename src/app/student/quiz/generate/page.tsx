'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Brain, ArrowLeft, AlertTriangle, FileText,
  CheckCircle, BookOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getNotes } from '@/lib/api/notes';
import { createQuiz, getQuizPreferences, getSubjectLimits } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import type { QuizDifficulty, SubjectLimits, NoteListItem } from '@/types';

const DIFF_ORDER: Record<QuizDifficulty, number> = { easy: 1, moderate: 2, difficult: 3 };
const DIFFICULTIES: { key: QuizDifficulty; label: string; desc: string; sel: string; idle: string }[] = [
  {
    key:  'easy',
    label: 'Easy',
    desc:  'Core concepts',
    sel:   'border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    idle:  'border-border bg-card text-muted-foreground hover:border-emerald-300',
  },
  {
    key:  'moderate',
    label: 'Moderate',
    desc:  'Test your grasp',
    sel:   'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    idle:  'border-border bg-card text-muted-foreground hover:border-amber-300',
  },
  {
    key:  'difficult',
    label: 'Difficult',
    desc:  'Deep understanding',
    sel:   'border-red-400 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300',
    idle:  'border-border bg-card text-muted-foreground hover:border-red-300',
  },
];
const Q_COUNTS = [5, 10, 15, 20];

// ── Note card for the manual picker ──────────────────────────

function NoteCard({
  note,
  selected,
  onSelect,
}: {
  note: NoteListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150',
        selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/30',
      )}
    >
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
        selected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
      )}>
        {selected ? <CheckCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', selected ? 'text-primary' : 'text-foreground')}>
          {note.file_name}
        </p>
        {note.subject && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{note.subject}</p>
        )}
      </div>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function GenerateQuizPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const hasInited    = useRef(false);

  // note_id in URL means we arrived from a specific note's page
  const prefilledNoteId = searchParams.get('note_id') ?? '';

  const [noteId,     setNoteId]     = useState(prefilledNoteId);
  const [submitting, setSubmitting] = useState(false);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('moderate');
  const [numQ,       setNumQ]       = useState(10);

  const cameFromNote = !!prefilledNoteId;

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

  // Initialise difficulty + count from saved preferences (once)
  useEffect(() => {
    if (prefs && !hasInited.current) {
      hasInited.current = true;
      setDifficulty(prefs.difficulty ?? 'moderate');
      setNumQ(prefs.num_questions ?? 10);
    }
  }, [prefs]);

  if (notesLoading || prefsLoading) return <LoadingPage />;

  const readyNotes   = notes?.results ?? [];
  const selectedNote = readyNotes.find((n) => n.id === noteId);
  const subject      = selectedNote?.subject ?? '';
  const limitsArr    = Array.isArray(allLimits) ? (allLimits as SubjectLimits[]) : [];
  const subjectLimit = subject
    ? limitsArr.find((l) => l.subject.toLowerCase() === subject.toLowerCase())
    : null;

  const blocked =
    subjectLimit &&
    (numQ < subjectLimit.min_questions ||
      DIFF_ORDER[difficulty] < DIFF_ORDER[subjectLimit.min_difficulty]);

  // Note found in URL but not in READY list (maybe still processing)
  const noteNotReady = cameFromNote && !selectedNote;

  const handleGenerate = async () => {
    if (!noteId) { toast.error('Please select a note.'); return; }
    setSubmitting(true);
    try {
      const res = await createQuiz({ note_id: noteId, difficulty, num_questions: numQ });
      toast.success('Quiz is being generated…');
      router.push(`/student/quiz/${res.quiz_id}/status`);
    } catch (err: unknown) {
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

  // ── Shared sections ───────────────────────────────────────

  const difficultySection = (stepLabel?: string) => (
    <section className="space-y-3">
      {stepLabel && (
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {stepLabel}
        </h2>
      )}
      <div className="grid grid-cols-3 gap-3">
        {DIFFICULTIES.map(({ key, label, desc, sel, idle }) => (
          <button
            key={key}
            type="button"
            onClick={() => setDifficulty(key)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-2xl border-2 py-4 text-sm transition-all duration-150',
              difficulty === key ? `${sel} shadow-sm scale-[1.03]` : idle,
            )}
          >
            <span className="font-bold">{label}</span>
            <span className="text-[11px] opacity-65">{desc}</span>
          </button>
        ))}
      </div>
    </section>
  );

  const questionCountSection = (stepLabel?: string) => (
    <section className="space-y-3">
      {stepLabel && (
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {stepLabel}
        </h2>
      )}
      <div className="flex gap-3">
        {Q_COUNTS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNumQ(n)}
            className={cn(
              'flex-1 rounded-2xl border-2 py-3 text-sm font-bold transition-all duration-150',
              numQ === n
                ? 'border-primary bg-primary/10 text-primary shadow-sm scale-[1.04]'
                : 'border-border bg-card text-muted-foreground hover:border-primary/30',
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </section>
  );

  const thresholdWarning = blocked && subjectLimit && (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">Teacher requirement not met for {subject}</p>
        <p className="mt-0.5">
          Requires at least{' '}
          <strong>{subjectLimit.min_questions} questions</strong> at{' '}
          <strong>{subjectLimit.min_difficulty} or higher</strong> difficulty.
        </p>
        <p className="mt-1 text-xs text-amber-700">Adjust your selections above.</p>
      </div>
    </motion.div>
  );

  const generateBtn = (
    <Button
      className="h-14 w-full gradient-primary rounded-2xl text-base font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90"
      disabled={!noteId || submitting || !!blocked || noteNotReady}
      onClick={handleGenerate}
    >
      {submitting ? (
        <span className="flex items-center gap-2.5">
          <Brain className="h-5 w-5 animate-pulse" /> Generating…
        </span>
      ) : (
        <span className="flex items-center gap-2.5">
          <Brain className="h-5 w-5" />
          Generate {numQ} Questions · {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </span>
      )}
    </Button>
  );

  // ── MODE A: Came from a note page — skip the picker ───────

  if (cameFromNote) {
    return (
      <div className="max-w-xl space-y-8 py-2">
        {/* Back to the specific note */}
        <Link href={`/student/notes/${prefilledNoteId}`}>
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Note
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Configure Quiz</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set your difficulty and question count — AI will generate from the note below.
          </p>
        </div>

        {/* Compact note card */}
        {noteNotReady ? (
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">This note isn&apos;t ready yet</p>
              <p className="mt-0.5">The note may still be processing. Please wait for it to finish.</p>
              <Link href={`/student/notes/${prefilledNoteId}`} className="mt-1.5 inline-block font-semibold underline">
                Check note status →
              </Link>
            </div>
          </div>
        ) : selectedNote ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{selectedNote.file_name}</p>
              {selectedNote.subject && (
                <p className="mt-0.5 text-xs text-muted-foreground">{selectedNote.subject}</p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Selected
            </span>
          </motion.div>
        ) : null}

        {/* Difficulty — no step numbers needed */}
        {difficultySection('Difficulty')}
        {questionCountSection('Number of Questions')}
        {thresholdWarning}
        {generateBtn}
      </div>
    );
  }

  // ── MODE B: Manual navigation — show full note picker ─────

  return (
    <div className="max-w-xl space-y-8 py-2">
      <Link href="/student/quiz">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> My Quizzes
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Generate a Quiz</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI builds questions directly from your notes.
        </p>
      </div>

      {/* Step 1: Note picker */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          1 · Select a Note
        </h2>
        {readyNotes.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You don&apos;t have any processed notes yet.{' '}
            <Link href="/student/notes/upload" className="font-semibold underline">
              Upload a note
            </Link>{' '}
            first.
          </div>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto pr-0.5">
            {readyNotes.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              >
                <NoteCard
                  note={n}
                  selected={noteId === n.id}
                  onSelect={() => setNoteId(n.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {difficultySection('2 · Difficulty')}
      {questionCountSection('3 · Number of Questions')}
      {thresholdWarning}
      {generateBtn}
    </div>
  );
}
