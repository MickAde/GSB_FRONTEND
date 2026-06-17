'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Brain, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getNotes } from '@/lib/api/notes';
import { createQuiz } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import type { QuizDifficulty } from '@/types';

const DIFFICULTIES: { value: QuizDifficulty; label: string; desc: string }[] = [
  { value: 'easy',      label: 'Easy',      desc: 'Basic recall' },
  { value: 'moderate',  label: 'Moderate',  desc: 'Application' },
  { value: 'difficult', label: 'Difficult', desc: 'Critical thinking' },
];

const QUESTION_COUNTS = [5, 10, 15, 20];

export default function GenerateQuizPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [noteId,      setNoteId]      = useState(searchParams.get('note_id') ?? '');
  const [difficulty,  setDifficulty]  = useState<QuizDifficulty>('moderate');
  const [numQ,        setNumQ]        = useState(10);
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    const id = searchParams.get('note_id');
    if (id) setNoteId(id);
  }, [searchParams]);

  const { data: notes, isLoading } = useQuery({
    queryKey: queryKeys.notes.all({ status: 'READY' }),
    queryFn:  () => getNotes({ status: 'READY' }),
  });

  if (isLoading) return <LoadingPage />;

  const readyNotes = notes?.results ?? [];

  const handleGenerate = async () => {
    if (!noteId) { toast.error('Please select a note.'); return; }
    setSubmitting(true);
    try {
      const res = await createQuiz({ note_id: noteId, difficulty, num_questions: numQ });
      toast.success('Quiz is being generated…');
      router.push(`/student/quiz/${res.quiz_id}/status`);
    } catch {
      toast.error('Failed to start quiz generation. Please try again.');
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
        description="Pick a note, choose your settings, and let AI build your quiz."
      />

      {/* Note selector */}
      <div className="space-y-2">
        <Label>Select a note</Label>
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

      {/* Difficulty */}
      <div className="space-y-2">
        <Label>Difficulty</Label>
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDifficulty(d.value)}
              className={`flex flex-col items-center rounded-xl border-2 p-3 text-center transition-all ${
                difficulty === d.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <span className="font-semibold text-sm text-foreground">{d.label}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Question count */}
      <div className="space-y-2">
        <Label>Number of questions</Label>
        <div className="flex gap-3">
          {QUESTION_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNumQ(n)}
              className={`flex h-11 w-14 items-center justify-center rounded-xl border-2 font-bold text-sm transition-all ${
                numQ === n
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-foreground/80 hover:border-primary/30'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full gradient-primary rounded-xl font-bold text-white shadow-md shadow-primary/25 hover:opacity-90 h-12"
        disabled={!noteId || submitting || readyNotes.length === 0}
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
