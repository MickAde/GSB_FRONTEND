'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Brain, Info, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getQuizPreferences, updateQuizPreferences, getSubjectLimits } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import type { QuizDifficulty, SubjectLimits } from '@/types';

const DIFFICULTIES: { value: QuizDifficulty; label: string; desc: string }[] = [
  { value: 'easy',      label: 'Easy',      desc: 'Basic recall'       },
  { value: 'moderate',  label: 'Moderate',  desc: 'Application'        },
  { value: 'difficult', label: 'Difficult', desc: 'Critical thinking'  },
];

const QUESTION_COUNTS = [5, 10, 15, 20, 30, 40];

const DIFF_ORDER: Record<QuizDifficulty, number> = { easy: 1, moderate: 2, difficult: 3 };

export default function StudentSettingsPage() {
  const qc = useQueryClient();
  const [numQ,       setNumQ]       = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<QuizDifficulty | null>(null);
  const [dirty,      setDirty]      = useState(false);

  const { data: prefs, isLoading: prefsLoading } = useQuery({
    queryKey: queryKeys.quiz.preferences(),
    queryFn:  getQuizPreferences,
    staleTime: 60_000,
  });

  const { data: limitsRaw } = useQuery({
    queryKey: queryKeys.quiz.subjectLimits(),
    queryFn:  () => getSubjectLimits(),
  });

  const limits = Array.isArray(limitsRaw) ? (limitsRaw as SubjectLimits[]) : [];

  const currentNumQ = numQ ?? prefs?.num_questions ?? 10;
  const currentDiff = difficulty ?? prefs?.difficulty ?? 'moderate';

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => updateQuizPreferences({ num_questions: currentNumQ, difficulty: currentDiff }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.quiz.preferences(), data);
      setDirty(false);
      toast.success('Quiz settings saved.');
    },
    onError: () => toast.error('Failed to save settings.'),
  });

  if (prefsLoading) return <LoadingPage />;

  const handleSetNumQ = (n: number) => { setNumQ(n); setDirty(true); };
  const handleSetDiff = (d: QuizDifficulty) => { setDifficulty(d); setDirty(true); };

  // Warn if current settings would be blocked for any subject
  const blockedSubjects = limits.filter(
    (l) =>
      currentNumQ < l.min_questions ||
      DIFF_ORDER[currentDiff] < DIFF_ORDER[l.min_difficulty],
  );

  return (
    <div className="max-w-xl space-y-8">
      <PageHeader
        title="Settings"
        description="Configure your default quiz preferences."
      />

      {/* Quiz Settings card */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Quiz Settings</h2>
        </div>

        <p className="text-sm text-muted-foreground">
          These defaults are used every time you generate a quiz. Your teacher may have set
          minimum requirements for specific subjects.
        </p>

        {/* Difficulty */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Default Difficulty</p>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => handleSetDiff(d.value)}
                className={`flex flex-col items-center rounded-xl border-2 p-3 text-center transition-all ${
                  currentDiff === d.value
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
          <p className="text-sm font-medium text-foreground">Default Number of Questions</p>
          <div className="flex flex-wrap gap-3">
            {QUESTION_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleSetNumQ(n)}
                className={`flex h-11 w-14 items-center justify-center rounded-xl border-2 font-bold text-sm transition-all ${
                  currentNumQ === n
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground/80 hover:border-primary/30'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Warning banner */}
        {blockedSubjects.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <Info className="h-4 w-4 shrink-0" />
              These settings won&apos;t meet teacher requirements for:
            </div>
            <ul className="list-disc pl-6 space-y-0.5">
              {blockedSubjects.map((l) => (
                <li key={l.subject}>
                  <span className="font-medium">{l.subject}</span>
                  {' — '}min {l.min_questions} questions, {l.min_difficulty} difficulty
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-700 mt-1">
              You can save these settings, but quizzes for those subjects will require higher values.
            </p>
          </div>
        )}

        <Button
          onClick={() => save()}
          disabled={!dirty || saving}
          className="w-full gradient-primary rounded-xl font-bold text-white shadow-md shadow-primary/25 hover:opacity-90 h-11"
        >
          {saving ? (
            'Saving…'
          ) : (
            <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Save Settings</span>
          )}
        </Button>
      </section>

      {/* Teacher requirements overview */}
      {limits.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Teacher Requirements</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Minimum quiz settings set by your teachers per subject.
          </p>
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {limits.map((l) => (
              <div key={l.subject} className="flex items-center justify-between px-4 py-3 bg-muted/20">
                <span className="text-sm font-medium text-foreground">{l.subject}</span>
                <span className="text-xs text-muted-foreground">
                  ≥ {l.min_questions} questions · {l.min_difficulty}+
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
